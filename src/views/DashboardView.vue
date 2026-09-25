<script setup>
import { computed } from 'vue'

import PanelSection from '../components/common/PanelSection.vue'
import StatCard from '../components/common/StatCard.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import EnvironmentCards from '../components/restoration/EnvironmentCards.vue'
import HeroBanner from '../components/restoration/HeroBanner.vue'
import {
  restorationEnvironment,
  restorationHero,
  restorationSteps,
} from '../data/restorationData'
import { useRestorationOverview } from '../composables/useRestorationOverview'
import { useRestorationFlows } from '../composables/useRestorationFlows'

const { batchCount, environmentCount, highRiskCount, ownerCount } =
  useRestorationOverview()
const { batches, ledger, storageWarning } = useRestorationFlows()

const statCards = computed(() => [
  { label: '在册批次', value: batchCount.value },
  { label: '高风险任务', value: highRiskCount.value },
  { label: '环境指标', value: environmentCount.value },
  { label: '参与修复师', value: ownerCount.value },
])

const recentFlows = computed(() => ledger.value.slice(0, 5))
</script>

<template>
  <div class="view-stack">
    <HeroBanner :hero="restorationHero" />

    <section class="stats-grid">
      <StatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
      />
    </section>

    <p v-if="storageWarning" class="storage-warning">{{ storageWarning }}</p>

    <section class="two-column">
      <PanelSection title="重点批次" badge="优先处理">
        <BatchGrid :items="batches" />
      </PanelSection>

      <PanelSection title="当日工序" badge="修复流程">
        <ol class="step-list">
          <li v-for="step in restorationSteps" :key="step">{{ step }}</li>
        </ol>
      </PanelSection>
    </section>

    <PanelSection title="最近办理" badge="流转动态">
      <ul v-if="recentFlows.length" class="recent-list">
        <li v-for="record in recentFlows" :key="record.id" class="recent-item">
          <RouterLink class="recent-link" :to="`/batches/${record.code}`">
            <span class="recent-code">{{ record.code }}</span>
            <span class="recent-change">
              <template v-if="record.fromLabel">{{ record.fromLabel }} → </template>
              {{ record.toLabel }}
            </span>
            <span class="recent-reason">{{ record.reason }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="recent-empty">还没有办理记录。</p>
      <RouterLink class="ledger-link" to="/flows">查看完整流转台账 →</RouterLink>
    </PanelSection>

    <PanelSection title="环境参数" badge="修复室 2">
      <EnvironmentCards :items="restorationEnvironment" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 24px;
}

.step-list {
  margin: 0;
  padding-left: 20px;
  color: #5c4a33;
}

.step-list li + li {
  margin-top: 12px;
}

.storage-warning {
  margin: 0;
  padding: 11px 15px;
  border-radius: 14px;
  background: #f6e5b9;
  color: #8b6314;
  font-size: 0.88rem;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.recent-link {
  display: grid;
  grid-template-columns: 64px 150px 1fr;
  gap: 12px;
  align-items: baseline;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(109, 80, 40, 0.08);
  text-decoration: none;
  color: inherit;
  font-size: 0.88rem;
}

.recent-link:hover {
  background: #f4ebda;
}

.recent-code {
  font-weight: bold;
  color: #5d4322;
}

.recent-change {
  color: #5c4a33;
}

.recent-reason {
  color: #82684b;
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-empty {
  margin: 0;
  color: #82684b;
}

.ledger-link {
  display: inline-block;
  margin-top: 14px;
  color: #5d4322;
  text-decoration: none;
  font-size: 0.88rem;
}

.ledger-link:hover {
  text-decoration: underline;
}

@media (max-width: 980px) {
  .stats-grid,
  .two-column {
    grid-template-columns: 1fr;
  }

  .recent-link {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
