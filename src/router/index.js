import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import BatchLibraryView from '../views/BatchLibraryView.vue'
import TaskBoardView from '../views/TaskBoardView.vue'
import FlowLedgerView from '../views/FlowLedgerView.vue'
import FlowDetailView from '../views/FlowDetailView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/batches',
    name: 'batches',
    component: BatchLibraryView,
  },
  {
    path: '/batches/:code',
    name: 'batch-flow',
    component: FlowDetailView,
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: TaskBoardView,
  },
  {
    path: '/flows',
    name: 'flows',
    component: FlowLedgerView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
