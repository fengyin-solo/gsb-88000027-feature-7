<script setup>
import { useRestorationFlow } from '../../composables/useRestorationFlow'

const { feedback, retryPendingChange, dismissFeedback } = useRestorationFlow()
</script>

<template>
  <div
    v-if="feedback"
    :class="['flow-feedback', `flow-feedback--${feedback.type}`]"
    role="alert"
  >
    <p>{{ feedback.message }}</p>
    <div class="flow-actions">
      <button type="button" class="retry" @click="retryPendingChange">
        重试提交
      </button>
      <button type="button" class="dismiss" @click="dismissFeedback">
        放弃本次修改
      </button>
    </div>
  </div>
</template>

<style scoped>
.flow-feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 16px;
  border: 1px solid rgba(145, 61, 47, 0.28);
  background: #f7e3dd;
  color: #7c3327;
}

.flow-feedback--write-failed {
  border-color: rgba(139, 99, 20, 0.32);
  background: #f6e5b9;
  color: #6f4d0f;
}

p {
  margin: 0;
}

.flow-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

button {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-family: inherit;
  cursor: pointer;
}

.retry {
  background: #5d4322;
  color: #fff8eb;
}

.dismiss {
  background: transparent;
  border-color: rgba(93, 67, 34, 0.35);
  color: #5d4322;
}

@media (max-width: 680px) {
  .flow-feedback {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
