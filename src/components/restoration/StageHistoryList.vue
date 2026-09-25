<script setup>
import { computed } from 'vue'

import { useRestorationFlow } from '../../composables/useRestorationFlow'
import { formatStageTime, stageMeta } from '../../utils/restorationFormatters'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

const { revertBatch } = useRestorationFlow()

const latestIdByBatch = computed(() => {
  const map = new Map()
  for (const record of props.records) {
    if (!map.has(record.batchCode)) {
      map.set(record.batchCode, record.id)
    }
  }
  return map
})

const countByBatch = computed(() => {
  const map = new Map()
  for (const record of props.records) {
    map.set(record.batchCode, (map.get(record.batchCode) ?? 0) + 1)
  }
  return map
})

function canRevert(record) {
  return (
    latestIdByBatch.value.get(record.batchCode) === record.id &&
    (countByBatch.value.get(record.batchCode) ?? 0) > 1
  )
}
</script>

<template>
  <ol v-if="records.length" class="history-list">
    <li v-for="record in records" :key="record.id" class="history-item">
      <div class="history-head">
        <strong>{{ record.batchCode }} · {{ record.batchTitle }}</strong>
        <time :datetime="record.recordedAt">
          {{ formatStageTime(record.recordedAt) }}
        </time>
      </div>
      <div class="history-stage">
        <span
          v-if="record.fromStage"
          :class="['stage-pill', `stage-pill--${stageMeta(record.fromStage).tone}`]"
        >
          {{ record.fromStage }}
        </span>
        <span v-else class="stage-pill stage-pill--seed">建档</span>
        <span class="arrow">→</span>
        <span
          :class="['stage-pill', `stage-pill--${stageMeta(record.toStage).tone}`]"
        >
          {{ record.toStage }}
        </span>
      </div>
      <p class="history-reason">{{ record.reason }}</p>
      <div class="history-foot">
        <small>经办：{{ record.operator }}</small>
        <button
          v-if="canRevert(record)"
          type="button"
          class="revert"
          @click="revertBatch(record.batchCode)"
        >
          回退上一阶段
        </button>
      </div>
    </li>
  </ol>
  <p v-else class="history-empty">暂无办理记录。</p>
</template>

<style scoped>
.history-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
  max-height: 430px;
  overflow-y: auto;
}

.history-item {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f4ebda;
  border: 1px solid rgba(109, 80, 40, 0.08);
}

.history-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

strong {
  font-size: 0.95rem;
}

time {
  color: #82684b;
  font-size: 0.78rem;
  white-space: nowrap;
}

.history-stage {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.stage-pill {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.stage-pill--prepare {
  background: #efe2ca;
  color: #7e6038;
}

.stage-pill--humidity {
  background: #d7e6ef;
  color: #2f5d75;
}

.stage-pill--archive {
  background: #d9ead9;
  color: #366338;
}

.stage-pill--seed {
  background: rgba(93, 67, 34, 0.12);
  color: #6a5439;
}

.arrow {
  color: #82684b;
}

.history-reason {
  margin: 10px 0 0;
  color: #5c4a33;
}

.history-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

small {
  color: #82684b;
}

.revert {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(93, 67, 34, 0.35);
  background: transparent;
  color: #5d4322;
  font-family: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.revert:hover {
  background: rgba(93, 67, 34, 0.1);
}

.history-empty {
  margin: 0;
  color: #82684b;
}
</style>
