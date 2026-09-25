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

export function stageMeta(stage) {
  const map = {
    补纸前: {
      tone: 'prepare',
    },
    控湿中: {
      tone: 'humidity',
    },
    归档前: {
      tone: 'archive',
    },
  }

  return map[stage] ?? map['补纸前']
}

export function formatStageTime(isoString) {
  if (!isoString) {
    return '时间未知'
  }
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return '时间未知'
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}
