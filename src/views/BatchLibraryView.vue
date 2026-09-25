<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import StageFlowFeedback from '../components/restoration/StageFlowFeedback.vue'
import StageHistoryList from '../components/restoration/StageHistoryList.vue'
import { useRestorationFlow } from '../composables/useRestorationFlow'

const { batchesWithStage, orderedHistory } = useRestorationFlow()
</script>

<template>
  <div class="view-stack">
    <PanelSection title="批次档案" badge="修复对象">
      <BatchGrid :items="batchesWithStage" />
    </PanelSection>

    <PanelSection title="办理历史" badge="完整记录">
      <StageFlowFeedback />
      <StageHistoryList :records="orderedHistory" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}
</style>
