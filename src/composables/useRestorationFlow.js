import { computed, reactive } from 'vue'

import {
  restorationBatches,
  restorationStages,
  restorationTasks,
} from '../data/restorationData'

const STORAGE_KEY = 'restoration-stage-flow-v1'

const seedRecordedAt = {
  'A-03': '2026-09-18T09:30:00+08:00',
  'B-11': '2026-09-19T10:05:00+08:00',
  'C-02': '2026-09-21T15:20:00+08:00',
}

function seedHistory() {
  return restorationBatches.map((batch) => ({
    id: `seed-${batch.code}`,
    batchCode: batch.code,
    batchTitle: batch.title,
    fromStage: null,
    toStage: batch.status,
    reason: '建档登记，沿用批次原始阶段名称。',
    operator: '建档登记',
    recordedAt: seedRecordedAt[batch.code] ?? '2026-09-18T09:00:00+08:00',
  }))
}

const state = reactive({
  loaded: false,
  version: 0,
  history: [],
  feedback: null,
})

function readPersisted() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.version !== 'number' || !Array.isArray(parsed.history)) {
      return null
    }
    return parsed
  } catch (error) {
    return null
  }
}

function writePersisted(next) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function ensureLoaded() {
  if (state.loaded) {
    return
  }
  const persisted = readPersisted()
  if (persisted) {
    state.version = persisted.version
    state.history = persisted.history
  } else {
    const seeded = { version: 1, history: seedHistory() }
    state.version = seeded.version
    state.history = seeded.history
    try {
      writePersisted(seeded)
    } catch (error) {
      // 本地存储不可用时仅保留内存态，不阻塞页面展示。
    }
  }
  state.loaded = true
}

function currentStageOf(batchCode) {
  for (let index = state.history.length - 1; index >= 0; index -= 1) {
    if (state.history[index].batchCode === batchCode) {
      return state.history[index].toStage
    }
  }
  return null
}

function batchTitleOf(batchCode) {
  return (
    restorationBatches.find((batch) => batch.code === batchCode)?.title ?? batchCode
  )
}

function setFeedback(type, message, payload) {
  state.feedback = { type, message, payload }
}

function commitTransition(payload) {
  ensureLoaded()
  const batchCode = payload?.batchCode
  const toStage = payload?.toStage
  const reason = payload?.reason?.trim()
  const operator = payload?.operator?.trim() || '当班修复师'
  if (!batchCode || !restorationStages.includes(toStage) || !reason) {
    return { ok: false }
  }

  const persisted = readPersisted()
  const persistedVersion = persisted ? persisted.version : 0
  if (persistedVersion !== state.version) {
    setFeedback(
      'conflict',
      '检测到办理记录已被其他窗口更新。为避免覆盖最近一次有效记录，本次提交未生效，请核对最新历史后重试。',
      { batchCode, toStage, reason, operator },
    )
    return { ok: false }
  }

  const fromStage = currentStageOf(batchCode)
  if (fromStage === toStage) {
    return { ok: false }
  }

  const record = {
    id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    batchCode,
    batchTitle: batchTitleOf(batchCode),
    fromStage,
    toStage,
    reason,
    operator,
    recordedAt: new Date().toISOString(),
  }
  const next = {
    version: state.version + 1,
    history: [...state.history, record],
  }
  try {
    writePersisted(next)
  } catch (error) {
    setFeedback(
      'write-failed',
      '写入本地存储失败，最近一次有效记录未被覆盖。请检查浏览器存储空间后重试。',
      { batchCode, toStage, reason, operator },
    )
    return { ok: false }
  }

  state.version = next.version
  state.history = next.history
  state.feedback = null
  return { ok: true, record }
}

function retryPendingChange() {
  const feedback = state.feedback
  if (!feedback?.payload) {
    return
  }
  if (feedback.type === 'conflict') {
    const persisted = readPersisted()
    if (persisted) {
      state.version = persisted.version
      state.history = persisted.history
    }
  }
  state.feedback = null
  commitTransition(feedback.payload)
}

function dismissFeedback() {
  state.feedback = null
}

function revertBatch(batchCode) {
  ensureLoaded()
  const records = state.history.filter((record) => record.batchCode === batchCode)
  if (records.length < 2) {
    return { ok: false }
  }
  const target = records[records.length - 2].toStage
  const current = records[records.length - 1].toStage
  return commitTransition({
    batchCode,
    toStage: target,
    reason: `回退：由「${current}」回到「${target}」。`,
  })
}

export function useRestorationFlow() {
  ensureLoaded()

  const latestStageByBatch = computed(() => {
    const map = {}
    for (const record of state.history) {
      map[record.batchCode] = record.toStage
    }
    return map
  })

  const batchesWithStage = computed(() =>
    restorationBatches.map((batch) => ({
      ...batch,
      status: latestStageByBatch.value[batch.code] ?? batch.status,
    })),
  )

  const tasksWithStage = computed(() =>
    restorationTasks.map((task) => ({
      ...task,
      stage: latestStageByBatch.value[task.batchCode] ?? task.stage,
    })),
  )

  const orderedHistory = computed(() => [...state.history].reverse())

  const feedback = computed(() => state.feedback)

  return {
    batchesWithStage,
    tasksWithStage,
    orderedHistory,
    feedback,
    commitTransition,
    retryPendingChange,
    dismissFeedback,
    revertBatch,
  }
}
