<script setup>
import { computed, ref, watch } from 'vue'

import { useRestorationFlows } from '../../composables/useRestorationFlows'

const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  defaultOperator: {
    type: String,
    default: '',
  },
})

const {
  adjacentStages,
  latestStage,
  latestStageLabel,
  pendingState,
  submitFlow,
  clearError,
  simulateConcurrentChange,
  versionOf,
  stageIndexOf,
  failNextWrite,
  setFailNextWrite,
} = useRestorationFlows()

const targetStage = ref('')
const reason = ref('')
const operator = ref(props.defaultOperator)
// 打开面板时所依据的版本号，是乐观锁的比较基准。
const baseVersion = ref(null)
// “下次写入失败”标志在仓库里不是响应式的，用本地引用驱动勾选框。
const failNext = ref(failNextWrite())

const state = computed(() => pendingState(props.code))
const options = computed(() => adjacentStages(props.code))
const currentLabel = computed(() => latestStageLabel(props.code))
const willRollback = computed(() => {
  if (!targetStage.value) return false
  return stageIndexOf(targetStage.value) < stageIndexOf(latestStage(props.code))
})

function refreshBaseVersion() {
  baseVersion.value = versionOf(props.code)
}

// 切换批次或首次挂载时捕获版本。
watch(
  () => props.code,
  () => {
    targetStage.value = ''
    refreshBaseVersion()
  },
  { immediate: true },
)

function chooseStage(event) {
  targetStage.value = event.target.value
  // 用户（重新）选择目标阶段，意味着已经核对过当前最新状态，刷新锁版本。
  refreshBaseVersion()
}

const feedback = computed(() => {
  const error = state.value.error
  if (!error) return ''
  if (error.code === 'VERSION_CONFLICT') {
    return `${error.message}（原因与办理人草稿已保留：请按最新阶段重新选择目标阶段，再点“重试办理”。）`
  }
  if (error.code === 'WRITE_FAILED') {
    return `${error.message}（草稿已保留，直接点“重试办理”即可。）`
  }
  return error.message
})

async function submit() {
  const result = await submitFlow({
    code: props.code,
    toStage: targetStage.value,
    reason: reason.value,
    operator: operator.value,
    expectedVersion: baseVersion.value,
  })
  if (result.ok) {
    targetStage.value = ''
    reason.value = ''
    refreshBaseVersion()
  } else if (result.code === 'VERSION_CONFLICT') {
    // 阶段已被他人推进：旧目标不再是新当前阶段的相邻阶段，需重新选择。
    targetStage.value = ''
  }
  // 模拟失败只生效一次，提交结束后让勾选框与仓库标志保持一致。
  failNext.value = failNextWrite()
}

function toggleFailNext(event) {
  failNext.value = event.target.checked
  setFailNextWrite(event.target.checked)
}

async function retry() {
  if (
    !targetStage.value ||
    !options.value.some((stage) => stage.key === targetStage.value)
  ) {
    return
  }
  await submit()
}
</script>

<template>
  <div class="transition-panel">
    <div class="transition-current">
      <span class="current-label">当前阶段</span>
      <strong>{{ currentLabel }}</strong>
    </div>

    <div class="transition-form">
      <label class="field">
        <span>目标阶段（推进 / 回退）</span>
        <select
          :value="targetStage"
          :disabled="state.writing"
          @change="chooseStage"
        >
          <option value="" disabled>选择相邻阶段</option>
          <option v-for="stage in options" :key="stage.key" :value="stage.key">
            {{ stage.label }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>变化原因（必填）</span>
        <textarea
          v-model="reason"
          rows="2"
          placeholder="说明本次由补纸前、控湿中或归档前发生变化的原因"
          :disabled="state.writing"
        />
      </label>
      <label class="field">
        <span>办理人</span>
        <input
          v-model="operator"
          type="text"
          placeholder="办理人姓名"
          :disabled="state.writing"
        />
      </label>

      <p v-if="willRollback" class="rollback-hint">
        本次为阶段回退，回退原因也会记入流水，可在台账中追溯。
      </p>

      <div v-if="feedback" class="feedback" :class="`feedback--${state.error.code}`">
        <span>{{ feedback }}</span>
        <button
          v-if="state.error.code === 'VERSION_CONFLICT' || state.error.code === 'WRITE_FAILED'"
          type="button"
          class="btn btn-retry"
          :disabled="state.writing || !targetStage"
          @click="retry"
        >
          重试办理
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          @click="clearError(code)"
        >
          关闭提示
        </button>
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="state.writing || !targetStage"
          @click="submit"
        >
          {{ state.writing ? '办理中…' : '提交办理' }}
        </button>
      </div>
    </div>

    <details class="demo-tools">
      <summary>演示：写入失败与并发修改</summary>
      <div class="demo-body">
        <label class="demo-check">
          <input
            type="checkbox"
            v-model="failNext"
            @change="toggleFailNext"
          />
          下一次提交模拟写入失败（记录不丢失，可重试）
        </label>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="state.writing"
          @click="simulateConcurrentChange(code)"
        >
          模拟另一终端刚更新此批次
        </button>
        <p class="demo-tip">
          先选择目标阶段并填好原因，再点“另一终端更新”，随后提交即可看到并发冲突提示。
        </p>
      </div>
    </details>
  </div>
</template>

<style scoped>
.transition-panel {
  display: grid;
  gap: 16px;
}

.transition-current {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.current-label {
  font-size: 0.8rem;
  color: #82684b;
}

.transition-current strong {
  font-size: 1.05rem;
}

.transition-form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 0.86rem;
  color: #6a5439;
}

.field select,
.field textarea,
.field input {
  font: inherit;
  padding: 9px 11px;
  border-radius: 12px;
  border: 1px solid rgba(109, 80, 40, 0.25);
  background: rgba(255, 255, 255, 0.85);
  color: #2d2418;
  resize: vertical;
}

.rollback-hint {
  margin: 0;
  padding: 9px 12px;
  border-radius: 12px;
  background: #f6e5b9;
  color: #8b6314;
  font-size: 0.84rem;
}

.feedback {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 12px;
  font-size: 0.86rem;
}

.feedback--VERSION_CONFLICT,
.feedback--WRITE_FAILED {
  background: #efd0c9;
  color: #913d2f;
}

.feedback--INVALID_TRANSITION,
.feedback--REASON_REQUIRED,
.feedback--VERSION_MISSING {
  background: #f6e5b9;
  color: #8b6314;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  font: inherit;
  padding: 9px 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-primary {
  background: #5d4322;
  color: #fff8eb;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-retry {
  background: #913d2f;
  color: #fff3ee;
}

.btn-retry:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  border-color: rgba(109, 80, 40, 0.35);
  color: #5d4322;
}

.demo-tools {
  border-top: 1px dashed rgba(109, 80, 40, 0.25);
  padding-top: 12px;
}

.demo-tools summary {
  cursor: pointer;
  color: #82684b;
  font-size: 0.84rem;
}

.demo-body {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.demo-check {
  font-size: 0.84rem;
  color: #6a5439;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.demo-tip {
  margin: 0;
  font-size: 0.78rem;
  color: #82684b;
}
</style>
