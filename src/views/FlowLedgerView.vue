<script setup>
import { computed, ref } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import { flowKindMeta, formatDateTime } from '../utils/restorationFormatters'
import { useRestorationFlows } from '../composables/useRestorationFlows'

const { ledger, storageWarning } = useRestorationFlows()

const filterCode = ref('all')
const filtered = computed(() =>
  filterCode.value === 'all'
    ? ledger.value
    : ledger.value.filter((record) => record.code === filterCode.value),
)

const batchOptions = computed(() =>
  [...new Set(ledger.value.map((record) => record.code))].sort(),
)
</script>

<template>
  <div class="view-stack">
    <p v-if="storageWarning" class="storage-warning">{{ storageWarning }}</p>

    <PanelSection title="流转台账" badge="全部批次 · 只追加">
      <div class="ledger-toolbar">
        <label class="filter-field">
          批次：
          <select v-model="filterCode">
            <option value="all">全部批次</option>
            <option v-for="codeOption in batchOptions" :key="codeOption" :value="codeOption">
              {{ codeOption }}
            </option>
          </select>
        </label>
        <span class="ledger-count">共 {{ filtered.length }} 条办理记录</span>
      </div>

      <div class="ledger-table">
        <div class="ledger-row ledger-head">
          <span>时间</span>
          <span>批次</span>
          <span>对象</span>
          <span>类型</span>
          <span>阶段变化</span>
          <span>原因</span>
          <span>办理人</span>
        </div>
        <div v-for="record in filtered" :key="record.id" class="ledger-row">
          <time>{{ formatDateTime(record.at) }}</time>
          <span>
            <RouterLink class="code-link" :to="`/batches/${record.code}`">
              {{ record.code }}
            </RouterLink>
          </span>
          <span>{{ record.batchTitle }}</span>
          <span :class="['kind-tag', `kind-tag--${flowKindMeta(record.kind).tone}`]">
            {{ flowKindMeta(record.kind).label }}
          </span>
          <span class="stage-change">
            <template v-if="record.fromLabel">{{ record.fromLabel }} → </template>
            {{ record.toLabel }}
          </span>
          <span class="reason-cell">{{ record.reason }}</span>
          <span>{{ record.operator }}</span>
        </div>
      </div>

      <p class="ledger-note">
        阶段名称取自每条记录写入时的快照；历史批次沿用原有阶段名称，不会因新记录被改写。
      </p>
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.storage-warning {
  margin: 0;
  padding: 11px 15px;
  border-radius: 14px;
  background: #f6e5b9;
  color: #8b6314;
  font-size: 0.88rem;
}

.ledger-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #6a5439;
}

.filter-field select {
  font: inherit;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(109, 80, 40, 0.25);
  background: rgba(255, 255, 255, 0.85);
}

.ledger-count {
  font-size: 0.84rem;
  color: #82684b;
}

.ledger-table {
  overflow: hidden;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
}

.ledger-row {
  display: grid;
  grid-template-columns: 1.1fr 0.6fr 1.1fr 0.5fr 1fr 1.6fr 0.7fr;
  gap: 12px;
  align-items: center;
  padding: 13px 16px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
}

.ledger-row + .ledger-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.ledger-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
}

.kind-tag {
  display: inline-flex;
  justify-content: center;
  width: fit-content;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.76rem;
  background: #efe2ca;
  color: #7e6038;
}

.kind-tag--rollback {
  background: #efd0c9;
  color: #913d2f;
}

.kind-tag--advance {
  background: #d9e4d6;
  color: #366338;
}

.stage-change {
  color: #5c4a33;
}

.reason-cell {
  color: #6a5439;
}

.code-link {
  color: #5d4322;
  text-decoration: none;
  font-weight: bold;
}

.code-link:hover {
  text-decoration: underline;
}

.ledger-note {
  margin: 12px 0 0;
  font-size: 0.8rem;
  color: #82684b;
}

@media (max-width: 1000px) {
  .ledger-table {
    overflow-x: auto;
  }

  .ledger-row {
    min-width: 980px;
  }
}
</style>
