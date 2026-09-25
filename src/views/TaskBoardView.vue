<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useRestorationFlow } from '../composables/useRestorationFlow'

const { tasksWithStage } = useRestorationFlow()
</script>

<template>
  <div class="view-stack">
    <PanelSection title="任务清单" badge="按风险排序">
      <TaskTable :rows="tasksWithStage" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
}
</style>
