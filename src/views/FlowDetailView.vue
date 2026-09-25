<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PanelSection from '../components/common/PanelSection.vue'
import TransitionPanel from '../components/restoration/TransitionPanel.vue'
import FlowTimeline from '../components/restoration/FlowTimeline.vue'
import { restorationBatches, restorationTasks } from '../data/restorationData'
import { useRestorationFlows } from '../composables/useRestorationFlows'
import { riskMeta } from '../utils/restorationFormatters'

const route = useRoute()
const code = computed(() => String(route.params.code))

const batch = computed(() =>
  restorationBatches.find((item) => item.code === code.value),
)
const task = computed(() =>
  restorationTasks.find((item) => item.code === code.value),
)

const { recordsFor, latestStageLabel, storageWarning } = useRestorationFlows()
const flowRecords = computed(() =>
  batch.value ? recordsFor(batch.value.code) : [],
)
</script>

<template>
  <div v-if="batch" class="view-stack">
    <p v-if="storageWarning" class="storage-warning">{{ storageWarning }}</p>

    <PanelSection
      :title="`批次 ${batch.code} · ${batch.title}`"
      badge="阶段流转"
    >
      <template #default>
        <div class="detail-summary">
          <span>页码：{{ batch.pages }}</span>
          <span :class="['risk-pill', `risk-pill--${riskMeta(batch.risk).tone}`]">
            风险 {{ riskMeta(batch.risk).label }}
          </span>
          <span>负责人：{{ task?.owner ?? '—' }}</span>
          <span>最新阶段：<strong>{{ latestStageLabel(batch.code) }}</strong></span>
        </div>
        <p class="detail-note">{{ batch.note }}</p>
      </template>
    </PanelSection>

    <div class="detail-columns">
      <PanelSection title="办理阶段" badge="推进 / 回退">
        <TransitionPanel :code="batch.code" :default-operator="task?.owner ?? ''" />
      </PanelSection>

      <PanelSection title="完整办理历史" badge="只追加">
        <FlowTimeline :records="flowRecords" />
        <p class="append-note">
          历史为追加式记录，阶段名称在每次办理时固化；新记录不会改写以往批次的阶段名称。
        </p>
      </PanelSection>
    </div>

    <RouterLink class="back-link" to="/batches">← 返回批次档案</RouterLink>
  </div>

  <PanelSection v-else title="未找到批次">
    <p>没有编号为 {{ code }} 的修复批次。</p>
    <RouterLink class="back-link" to="/batches">返回批次档案</RouterLink>
  </PanelSection>
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

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  font-size: 0.92rem;
  color: #5c4a33;
}

.risk-pill {
  padding: 5px 10px;
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

.detail-note {
  margin: 12px 0 0;
  color: #6a5439;
}

.detail-columns {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 24px;
  align-items: start;
}

.append-note {
  margin: 14px 0 0;
  font-size: 0.8rem;
  color: #82684b;
}

.back-link {
  color: #5d4322;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 980px) {
  .detail-columns {
    grid-template-columns: 1fr;
  }
}
</style>
