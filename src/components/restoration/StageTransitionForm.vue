<script setup>
import { computed, ref } from 'vue'

import { useRestorationFlow } from '../../composables/useRestorationFlow'
import { restorationStages } from '../../data/restorationData'

const { batchesWithStage, commitTransition } = useRestorationFlow()

const batchCode = ref('')
const toStage = ref('')
const operator = ref('')
const reason = ref('')
const localError = ref('')

const selectedBatch = computed(() =>
  batchesWithStage.value.find((batch) => batch.code === batchCode.value),
)

function submit() {
  localError.value = ''
  if (!batchCode.value || !toStage.value || !reason.value.trim()) {
    localError.value = '请完整选择批次、目标阶段并填写办理原因。'
    return
  }
  if (selectedBatch.value?.status === toStage.value) {
    localError.value = '目标阶段与当前阶段相同，无需重复登记。'
    return
  }
  const result = commitTransition({
    batchCode: batchCode.value,
    toStage: toStage.value,
    operator: operator.value,
    reason: reason.value,
  })
  if (result.ok) {
    toStage.value = ''
    operator.value = ''
    reason.value = ''
  }
}
</script>

<template>
  <form class="flow-form" @submit.prevent="submit">
    <label>
      <span>批次</span>
      <select v-model="batchCode">
        <option value="" disabled>选择批次</option>
        <option
          v-for="batch in batchesWithStage"
          :key="batch.code"
          :value="batch.code"
        >
          {{ batch.code }} · {{ batch.title }}（当前：{{ batch.status }}）
        </option>
      </select>
    </label>

    <label>
      <span>目标阶段</span>
      <select v-model="toStage">
        <option value="" disabled>选择阶段（可前进或回退）</option>
        <option v-for="stage in restorationStages" :key="stage" :value="stage">
          {{ stage }}
        </option>
      </select>
    </label>

    <label>
      <span>经办人（选填）</span>
      <input v-model="operator" type="text" placeholder="当班修复师" />
    </label>

    <label>
      <span>办理原因</span>
      <textarea
        v-model="reason"
        rows="3"
        placeholder="记录本次阶段变化的原因，便于追溯与回退。"
      />
    </label>

    <p v-if="localError" class="form-error">{{ localError }}</p>

    <button type="submit">登记阶段变化</button>
  </form>
</template>

<style scoped>
.flow-form {
  display: grid;
  gap: 14px;
  align-content: start;
}

label {
  display: grid;
  gap: 6px;
}

span {
  font-size: 0.82rem;
  color: #775936;
  letter-spacing: 0.06em;
}

select,
input,
textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(109, 80, 40, 0.22);
  background: rgba(255, 255, 255, 0.85);
  font-family: inherit;
  color: #2d2418;
}

textarea {
  resize: vertical;
}

.form-error {
  margin: 0;
  color: #913d2f;
  font-size: 0.86rem;
}

button {
  padding: 11px 18px;
  border: none;
  border-radius: 999px;
  background: #5d4322;
  color: #fff8eb;
  font-family: inherit;
  cursor: pointer;
}

button:hover {
  background: #4a3419;
}
</style>
