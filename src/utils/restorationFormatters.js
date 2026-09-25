export function riskMeta(risk) {
  const map = {
    high: {
      label: '高',
      tone: 'high',
    },
    medium: {
      label: '中',
      tone: 'medium',
    },
    low: {
      label: '低',
      tone: 'low',
    },
  }

  return map[risk] ?? map.low
}

const flowKindMap = {
  enroll: { label: '登记', tone: 'enroll' },
  advance: { label: '推进', tone: 'advance' },
  rollback: { label: '回退', tone: 'rollback' },
}

export function flowKindMeta(kind) {
  return flowKindMap[kind] ?? { label: '办理', tone: 'enroll' }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
