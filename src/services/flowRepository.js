import { restorationSeedFlows } from '../data/restorationData'

// 流转记录的持久化键。带版本号，结构变化时不会误读旧数据。
const STORAGE_KEY = 'conservation-desk:flow-ledger:v1'
const SETTINGS_KEY = 'conservation-desk:flow-settings:v1'

// 模拟异步写入的网络耗时，期间可能发生并发修改。
const WRITE_DELAY_MS = 600

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function readLedger() {
  let raw = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // 隐私模式或存储被禁用时退化为内存态，不阻断办理流程。
    return { records: clone(restorationSeedFlows), storageAvailable: false }
  }

  if (!raw) {
    return { records: clone(restorationSeedFlows), storageAvailable: true }
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.records)) {
      throw new Error('invalid ledger shape')
    }
    return { records: parsed.records, storageAvailable: true }
  } catch {
    // 持久化数据损坏：保留内存中的有效数据，不覆盖最近一次有效记录。
    return { records: clone(restorationSeedFlows), storageAvailable: true, corrupted: true }
  }
}

function readSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 设置写不进去不影响核心流水。
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * 流转流水仓库：
 * - 记录只追加（append-only），任何阶段名称随记录在写入时固化；
 * - 以每个批次的 version 做乐观并发控制，并发提交时后写入的一方会收到冲突错误，
 *   而不是静默覆盖最近一次有效记录；
 * - 写入失败 / 冲突时已落库的记录保持不变，由调用方提示重试。
 */
class FlowRepository {
  constructor() {
    const initial = readLedger()
    this.records = initial.records
    this.storageAvailable = initial.storageAvailable
    this.storageCorrupted = Boolean(initial.corrupted)
    this.settings = readSettings()
  }

  persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ records: this.records }),
      )
      this.storageCorrupted = false
    } catch {
      const error = new Error('WRITE_FAILED')
      error.code = 'WRITE_FAILED'
      throw error
    }
  }

  currentVersion(code) {
    return this.records.filter((record) => record.code === code).length
  }

  // 其他标签页写入后，storage 事件通知本标签页重新读取共享存储，
  // 让本页面看到的“最近一次有效记录”保持最新。
  reload() {
    const latest = readLedger()
    this.records = latest.records
    this.storageAvailable = latest.storageAvailable
    this.storageCorrupted = Boolean(latest.corrupted)
  }

  // 模拟一次服务端写入：延迟后做版本校验，再原子地追加记录。
  async appendRecord({ record, expectedVersion }) {
    await delay(WRITE_DELAY_MS)

    if (this.settings.failNextWrite) {
      this.settings.failNextWrite = false
      writeSettings(this.settings)
      const error = new Error('WRITE_FAILED')
      error.code = 'WRITE_FAILED'
      throw error
    }

    const currentVersion = this.currentVersion(record.code)
    if (currentVersion !== expectedVersion) {
      const error = new Error('VERSION_CONFLICT')
      error.code = 'VERSION_CONFLICT'
      error.currentVersion = currentVersion
      throw error
    }

    this.records = [...this.records, record]
    this.persist()
    return clone(record)
  }

  // 演示并发：模拟在另一台终端先追加了一条记录，使本页面待提交的版本过期。
  simulateRemoteAppend(record) {
    this.records = [...this.records, record]
    this.persist()
    return clone(record)
  }

  setFailNextWrite(value) {
    this.settings.failNextWrite = value
    writeSettings(this.settings)
  }

  get failNextWrite() {
    return Boolean(this.settings.failNextWrite)
  }
}

export const flowRepository = new FlowRepository()
