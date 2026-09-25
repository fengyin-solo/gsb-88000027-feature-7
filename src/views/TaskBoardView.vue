<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useRestorationFlows } from '../composables/useRestorationFlows'

const { tasks, storageWarning } = useRestorationFlows()
</script>

<template>
  <div class="view-stack">
    <p v-if="storageWarning" class="storage-warning">{{ storageWarning }}</p>
    <PanelSection title="任务清单" badge="按风险排序">
      <p class="board-note">
        每行阶段与批次卡片同源；点击“阶段流转”可办理推进 / 回退并查看完整历史。
      </p>
      <TaskTable :rows="tasks" />
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

.board-note {
  margin: 0 0 16px;
  color: #82684b;
  font-size: 0.88rem;
}
</style>
