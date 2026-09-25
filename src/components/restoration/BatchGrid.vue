<script setup>
import { riskMeta } from '../../utils/restorationFormatters'

defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="batch-grid">
    <RouterLink
      v-for="item in items"
      :key="item.code"
      :to="`/batches/${item.code}`"
      class="batch-card"
    >
      <div class="batch-head">
        <small>批次 {{ item.code }}</small>
        <span :class="['risk-pill', `risk-pill--${riskMeta(item.risk).tone}`]">
          {{ riskMeta(item.risk).label }}
        </span>
      </div>
      <h4>{{ item.title }}</h4>
      <p>页码：{{ item.pages }}</p>
      <p>
        最新阶段：<strong>{{ item.status }}</strong>
      </p>
      <small v-if="item.lastReason">最近办理：{{ item.lastReason }}</small>
      <small v-else>{{ item.note }}</small>
      <span class="card-cta">查看流转历史 →</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.batch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.batch-card {
  display: grid;
  align-content: start;
  gap: 0;
  padding: 18px;
  border-radius: 20px;
  background: #f4ebda;
  border: 1px solid rgba(109, 80, 40, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.batch-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(100, 73, 34, 0.12);
}

.batch-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

h4,
p,
small {
  margin: 0;
}

h4 {
  font-size: 1.04rem;
  margin-top: 10px;
}

p,
small {
  color: #6a5439;
}

p + p,
p + small,
small + .card-cta {
  margin-top: 6px;
}

.card-cta {
  margin-top: 12px;
  font-size: 0.8rem;
  color: #5d4322;
}

.risk-pill {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
}

.risk-pill--high {
  background: #efd0c9;
  color: #913d2f;
}

.risk-pill--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.risk-pill--low {
  background: #d9ead9;
  color: #366338;
}

@media (max-width: 960px) {
  .batch-grid {
    grid-template-columns: 1fr;
  }
}
</style>
