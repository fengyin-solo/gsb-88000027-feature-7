<script setup>
import { computed } from 'vue'

import { flowKindMeta, formatDateTime } from '../../utils/restorationFormatters'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
})

// 时间线按时间正序展示，最新记录落在最后。
const ordered = computed(() =>
  [...props.records].sort((a, b) => a.at.localeCompare(b.at)),
)
</script>

<template>
  <ol class="flow-timeline">
    <li
      v-for="(record, index) in ordered"
      :key="record.id"
      class="flow-item"
      :class="`flow-item--${flowKindMeta(record.kind).tone}`"
    >
      <div class="flow-marker">
        <span class="flow-kind">{{ flowKindMeta(record.kind).label }}</span>
      </div>
      <div class="flow-body">
        <div class="flow-head">
          <span class="flow-change">
            <template v-if="record.fromLabel">
              {{ record.fromLabel }}
              <span class="flow-arrow">→</span>
            </template>
            <strong>{{ record.toLabel }}</strong>
          </span>
          <time>{{ formatDateTime(record.at) }}</time>
        </div>
        <p class="flow-reason">{{ record.reason }}</p>
        <small class="flow-meta">
          办理人：{{ record.operator }}
          <template v-if="index === ordered.length - 1">· 最新一次有效记录</template>
        </small>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.flow-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0;
}

.flow-item {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
  padding-bottom: 20px;
  position: relative;
}

.flow-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 31px;
  top: 30px;
  bottom: 0;
  width: 2px;
  background: rgba(109, 80, 40, 0.18);
}

.flow-marker {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

.flow-kind {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 26px;
  border-radius: 999px;
  font-size: 0.74rem;
  background: #efe2ca;
  color: #7e6038;
}

.flow-item--rollback .flow-kind {
  background: #efd0c9;
  color: #913d2f;
}

.flow-item--advance .flow-kind {
  background: #d9e4d6;
  color: #366338;
}

.flow-body {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(109, 80, 40, 0.1);
  border-radius: 16px;
  padding: 12px 14px;
}

.flow-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.92rem;
}

.flow-arrow {
  margin: 0 4px;
  color: #82684b;
}

.flow-head time {
  color: #82684b;
  font-size: 0.8rem;
}

.flow-reason {
  margin: 8px 0 0;
  color: #5c4a33;
  font-size: 0.9rem;
}

.flow-meta {
  display: block;
  margin-top: 6px;
  color: #82684b;
  font-size: 0.78rem;
}
</style>
