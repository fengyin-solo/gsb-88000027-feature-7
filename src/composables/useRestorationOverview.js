import { computed } from 'vue'

import { restorationEnvironment } from '../data/restorationData'
import { useRestorationFlows } from './useRestorationFlows'

export function useRestorationOverview() {
  const { batches, tasks } = useRestorationFlows()

  const batchCount = computed(() => batches.value.length)
  const highRiskCount = computed(
    () => tasks.value.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationEnvironment.length)
  const ownerCount = computed(
    () => new Set(tasks.value.map((item) => item.owner)).size,
  )

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
  }
}
