<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import BatchGrid from '../components/restoration/BatchGrid.vue'
import { useRestorationFlows } from '../composables/useRestorationFlows'

const { batches, storageWarning } = useRestorationFlows()
</script>

<template>
  <div class="view-stack">
    <p v-if="storageWarning" class="storage-warning">{{ storageWarning }}</p>
    <PanelSection title="批次档案" badge="修复对象">
      <p class="library-note">
        批次卡片显示的阶段来自最新一次有效办理记录，与任务清单、流转台账保持同步。
      </p>
      <BatchGrid :items="batches" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
}

.storage-warning {
  margin: 0 0 24px;
  padding: 11px 15px;
  border-radius: 14px;
  background: #f6e5b9;
  color: #8b6314;
  font-size: 0.88rem;
}

.library-note {
  margin: 0 0 16px;
  color: #82684b;
  font-size: 0.88rem;
}
</style>
