<script setup>
import { riskMeta } from '../../utils/restorationFormatters'

defineProps({
  rows: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="task-table">
    <div class="task-row task-head">
      <span>对象</span>
      <span>最新阶段</span>
      <span>风险</span>
      <span>负责人</span>
      <span>说明</span>
      <span>办理</span>
    </div>
    <div
      v-for="row in rows"
      :key="`${row.code}-${row.owner}`"
      class="task-row"
    >
      <span>{{ row.title }}</span>
      <span :class="['stage-tag', `stage-tag--${row.stageKey ?? 'none'}`]">
        {{ row.stage }}
      </span>
      <span :class="['risk-tag', `risk-tag--${riskMeta(row.risk).tone}`]">
        {{ riskMeta(row.risk).label }}
      </span>
      <span>{{ row.owner }}</span>
      <span>{{ row.note }}</span>
      <span>
        <RouterLink class="flow-link" :to="`/batches/${row.code}`">
          阶段流转 →
        </RouterLink>
      </span>
    </div>
  </div>
</template>

<style scoped>
.task-table {
  overflow: hidden;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
}

.task-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.5fr 0.7fr 1.3fr 0.8fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.72);
}

.task-row + .task-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.task-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.risk-tag {
  display: inline-flex;
  justify-content: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
}

.risk-tag--high {
  background: #efd0c9;
  color: #913d2f;
}

.risk-tag--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.risk-tag--low {
  background: #d9ead9;
  color: #366338;
}

.stage-tag {
  display: inline-flex;
  justify-content: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: #e7e0d2;
  color: #5c4a33;
  font-size: 0.84rem;
}

.flow-link {
  color: #5d4322;
  text-decoration: none;
  font-size: 0.86rem;
  white-space: nowrap;
}

.flow-link:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .task-table {
    overflow-x: auto;
  }

  .task-row {
    min-width: 860px;
  }
}
</style>
