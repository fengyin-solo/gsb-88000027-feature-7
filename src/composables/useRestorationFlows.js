import { computed, reactive, ref } from 'vue'

import {
  restorationBatches,
  restorationStages,
  restorationTasks,
} from '../data/restorationData'
import { flowRepository } from '../services/flowRepository'

const stageIndex = Object.fromEntries(
  restorationStages.map((stage, index) => [stage.key, index]),
)

export function stageLabelOf(key) {
  return restorationStages.find((stage) => stage.key === key)?.label ?? key
}

export function stageIndexOf(key) {
  return stageIndex[key] ?? -1
}

// 模块级单例状态：从任一入口进入都共享同一份流水，路由往返后历史仍在。
const records = ref(clone(flowRepository.records))
const storageWarning = ref(
  flowRepository.storageCorrupted
    ? '本地流水数据无法读取，已暂时使用初始记录；修复存储后刷新即可恢复。'
    : flowRepository.storageAvailable
      ? ''
      : '浏览器存储不可用，本次办理仅保存在当前页面，刷新后会丢失。',
)
const pending = reactive({})
let started = false

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ensurePending(code) {
  if (!pending[code]) {
    pending[code] = { writing: false, error: null }
  }
  return pending[code]
}

function syncFromRepository() {
  records.value = clone(flowRepository.records)
}

export function useRestorationFlows() {
  // 首次使用时启动一次：监听其他标签页 / 模拟的并发写入。
  if (!started) {
    started = true
    window.addEventListener('storage', (event) => {
      if (event.key === 'conservation-desk:flow-ledger:v1') {
        flowRepository.reload()
        syncFromRepository()
      }
    })
  }

  const recordsFor = (code) =>
    records.value
      .filter((record) => record.code === code)
      .sort((a, b) => a.at.localeCompare(b.at))

  const latestRecord = (code) => {
    const list = recordsFor(code)
    return list.length ? list[list.length - 1] : null
  }

  const latestStage = (code) => latestRecord(code)?.toStage ?? null

  // 阶段名称始终取最新记录写入时的快照，不直接读当前阶段表。
  const latestStageLabel = (code) => latestRecord(code)?.toLabel ?? '未登记'

  const enrichBatch = (batch) => ({
    ...batch,
    status: latestStageLabel(batch.code),
    stageKey: latestStage(batch.code),
    lastReason: latestRecord(batch.code)?.reason ?? '',
    lastAt: latestRecord(batch.code)?.at ?? null,
  })

  const enrichTask = (task) => ({
    ...task,
    stage: latestStageLabel(task.code),
    stageKey: latestStage(task.code),
  })

  const batches = computed(() =>
    restorationBatches.map((batch) => enrichBatch(batch)),
  )

  const tasks = computed(() =>
    restorationTasks.map((task) => enrichTask(task)),
  )

  // 台账按时间倒序，最新一次有效记录排在最前。
  const ledger = computed(() =>
    [...records.value]
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((record) => {
        const batch = restorationBatches.find((item) => item.code === record.code)
        const task = restorationTasks.find((item) => item.code === record.code)
        return {
          ...record,
          batchTitle: batch?.title ?? '未知批次',
          owner: task?.owner ?? '—',
        }
      }),
  )

  function adjacentStages(code) {
    const current = latestStage(code)
    if (current == null) return []
    const index = stageIndex[current]
    return restorationStages
      .map((stage, stageIndexNumber) => ({ stage, stageIndexNumber }))
      .filter(({ stageIndexNumber }) => Math.abs(stageIndexNumber - index) === 1)
      .map(({ stage }) => stage)
  }

  function buildRecord({ code, toStage, reason, operator, kind }) {
    const current = latestRecord(code)
    return {
      id: `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      kind,
      fromStage: current?.toStage ?? null,
      toStage,
      // 阶段名称在此刻固化进记录，后续重命名阶段也不会改写历史。
      fromLabel: current?.toLabel ?? null,
      toLabel: stageLabelOf(toStage),
      reason: reason.trim(),
      operator: operator.trim() || '未署名',
      at: new Date().toISOString(),
    }
  }

  // 办理表单在打开时记录所依据的版本号；提交时带上，构成乐观锁。
  function versionOf(code) {
    return flowRepository.currentVersion(code)
  }

  async function submitFlow({ code, toStage, reason, operator, expectedVersion }) {
    const state = ensurePending(code)
    if (state.writing) {
      return { ok: false, code: 'ALREADY_WRITING' }
    }

    if (!reason.trim()) {
      state.error = {
        code: 'REASON_REQUIRED',
        message: '请填写本次变化的原因，回退同样需要说明。',
      }
      return { ok: false, code: 'REASON_REQUIRED' }
    }

    if (typeof expectedVersion !== 'number') {
      state.error = {
        code: 'VERSION_MISSING',
        message: '办理依据的版本缺失，请重新打开办理面板后再试。',
      }
      return { ok: false, code: 'VERSION_MISSING' }
    }

    // 打开面板后该批次被其他终端更新过：先报并发冲突，保证旧表单不会
    // 因为“目标不再相邻”而给出误导性提示，也绝不让旧草稿覆盖新记录。
    if (flowRepository.currentVersion(code) !== expectedVersion) {
      state.error = {
        code: 'VERSION_CONFLICT',
        message:
          '该批次刚被其他终端更新过，为避免覆盖最近一次有效记录，本次办理未保存。请核对最新阶段后重新选择目标阶段。',
      }
      return { ok: false, code: 'VERSION_CONFLICT' }
    }

    const currentStage = latestStage(code)
    const isAdjacent =
      currentStage != null &&
      Math.abs(stageIndex[toStage] - stageIndex[currentStage]) === 1
    if (!isAdjacent) {
      state.error = {
        code: 'INVALID_TRANSITION',
        message: '只能向相邻阶段办理（推进或回退），请重新选择目标阶段。',
      }
      return { ok: false, code: 'INVALID_TRANSITION' }
    }

    const kind =
      stageIndex[toStage] > stageIndex[currentStage] ? 'advance' : 'rollback'
    const record = buildRecord({ code, toStage, reason, operator, kind })

    state.writing = true
    state.error = null
    try {
      await flowRepository.appendRecord({ record, expectedVersion })
      syncFromRepository()
      return { ok: true }
    } catch (error) {
      if (error.code === 'VERSION_CONFLICT') {
        state.error = {
          code: 'VERSION_CONFLICT',
          message:
            '该批次刚被其他终端更新过，为避免覆盖最近一次有效记录，本次办理未保存。请核对最新阶段后直接重试。',
        }
        return { ok: false, code: 'VERSION_CONFLICT' }
      }
      state.error = {
        code: 'WRITE_FAILED',
        message: '写入失败，最近一次有效记录未受影响。请检查后重试本次办理。',
      }
      return { ok: false, code: 'WRITE_FAILED' }
    } finally {
      state.writing = false
    }
  }

  // 冲突 / 失败时表单草稿（目标阶段、原因、操作人）由组件保留，
  // 用户核对最新阶段后用同一份草稿再次调用 submitFlow 即可重试。
  function clearError(code) {
    ensurePending(code).error = null
  }

  function pendingState(code) {
    return ensurePending(code)
  }

  function simulateConcurrentChange(code) {
    const current = latestRecord(code)
    const currentIndex = stageIndex[current?.toStage]
    const moveForward = currentIndex < restorationStages.length - 1
    const next = restorationStages[moveForward ? currentIndex + 1 : currentIndex - 1]
    const record = buildRecord({
      code,
      toStage: next.key,
      reason: '另一终端的修复师先一步提交了阶段办理（并发演示）。',
      operator: '其他终端',
      kind: moveForward ? 'advance' : 'rollback',
    })
    record.id = `remote-${Date.now()}`
    flowRepository.simulateRemoteAppend(record)
    syncFromRepository()
  }

  return {
    records,
    storageWarning,
    ledger,
    batches,
    tasks,
    recordsFor,
    latestRecord,
    latestStage,
    latestStageLabel,
    adjacentStages,
    versionOf,
    submitFlow,
    clearError,
    pendingState,
    simulateConcurrentChange,
    failNextWrite: () => flowRepository.failNextWrite,
    setFailNextWrite: (value) => flowRepository.setFailNextWrite(value),
  }
}
