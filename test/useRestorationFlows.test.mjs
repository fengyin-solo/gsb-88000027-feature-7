// 业务层验证：阶段派生、卡片/任务行同步、推进回退、并发冲突与重试。
import assert from 'node:assert/strict'

const store = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  },
  setTimeout: (fn) => setImmediate(fn),
  addEventListener: () => {},
}

const { useRestorationFlows } = await import(
  '../src/composables/useRestorationFlows.js'
)

const flow = useRestorationFlows()

let passed = 0
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed += 1
    console.log(`✓ ${name}`)
  })
}

await test('批次卡片与任务行从同一流水派生，初始阶段一致', () => {
  const batch = flow.batches.value.find((b) => b.code === 'A-03')
  const task = flow.tasks.value.find((t) => t.code === 'A-03')
  assert.equal(batch.status, '补纸前')
  assert.equal(task.stage, '补纸前')
})

await test('相邻阶段推进成功，卡片与任务同步更新', async () => {
  const result = await flow.submitFlow({
    code: 'A-03',
    toStage: 'humidity',
    reason: '降湿满 48 小时，进入控湿。',
    operator: '韩澈',
    expectedVersion: flow.versionOf('A-03'),
  })
  assert.equal(result.ok, true)
  assert.equal(flow.latestStageLabel('A-03'), '控湿中')
  assert.equal(
    flow.tasks.value.find((t) => t.code === 'A-03').stage,
    '控湿中',
  )
  assert.equal(
    flow.batches.value.find((b) => b.code === 'A-03').status,
    '控湿中',
  )
})

await test('只能向相邻阶段办理，跨阶段被拒绝且原因必填', async () => {
  // 先合法推进到归档前（端点），制造“跨阶段”的可能
  const advanced = await flow.submitFlow({
    code: 'A-03',
    toStage: 'pre-archive',
    reason: '控湿达标，进入归档前复核。',
    operator: '韩澈',
    expectedVersion: flow.versionOf('A-03'),
  })
  assert.equal(advanced.ok, true)

  const skip = await flow.submitFlow({
    code: 'A-03',
    toStage: 'pre-repair',
    reason: '想从归档前直接跳回补纸前',
    operator: '韩澈',
    expectedVersion: flow.versionOf('A-03'),
  })
  assert.equal(skip.ok, false)
  assert.equal(skip.code, 'INVALID_TRANSITION')

  const noReason = await flow.submitFlow({
    code: 'A-03',
    toStage: 'humidity',
    reason: '   ',
    operator: '韩澈',
    expectedVersion: flow.versionOf('A-03'),
  })
  assert.equal(noReason.code, 'REASON_REQUIRED')
  // 被拒绝后最近一次有效记录仍是推进到归档前那条
  assert.equal(flow.latestStageLabel('A-03'), '归档前')
})

await test('回退到上一阶段成功，记录类型为 rollback 且名称快照固化', async () => {
  const result = await flow.submitFlow({
    code: 'A-03',
    toStage: 'humidity',
    reason: '复查发现固色未达标，退回控湿中重新评估。',
    operator: '韩澈',
    expectedVersion: flow.versionOf('A-03'),
  })
  assert.equal(result.ok, true)
  const records = flow.recordsFor('A-03')
  assert.equal(records.at(-1).kind, 'rollback')
  assert.equal(records.at(-1).fromLabel, '归档前')
  assert.equal(records.at(-1).toLabel, '控湿中')
  // 最早的登记记录名称仍是当初的“补纸前”，没有被新记录改写
  assert.equal(records[0].toLabel, '补纸前')
  assert.equal(flow.latestStageLabel('A-03'), '控湿中')
})

await test('并发修改后提交冲突，最近一次有效记录不被覆盖', async () => {
  const baseVersion = flow.versionOf('B-11')
  // 用户打开面板后，另一终端先把 B-11 推进到归档前
  flow.simulateConcurrentChange('B-11')
  assert.equal(flow.latestStageLabel('B-11'), '归档前')

  const result = await flow.submitFlow({
    code: 'B-11',
    toStage: 'pre-repair',
    reason: '本地基于旧阶段想回退',
    operator: '陆宁',
    expectedVersion: baseVersion,
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'VERSION_CONFLICT')
  // 最近一次有效记录仍然是“其他终端”的推进
  assert.equal(flow.latestStageLabel('B-11'), '归档前')
  assert.equal(flow.recordsFor('B-11').at(-1).operator, '其他终端')
})

await test('写入失败后记录不变；以新版本重试成功', async () => {
  flow.setFailNextWrite(true)
  const failed = await flow.submitFlow({
    code: 'C-02',
    toStage: 'humidity',
    reason: '封套改尺寸，退回控湿等待。',
    operator: '周恬',
    expectedVersion: flow.versionOf('C-02'),
  })
  assert.equal(failed.code, 'WRITE_FAILED')
  assert.equal(flow.latestStageLabel('C-02'), '归档前')

  const retried = await flow.submitFlow({
    code: 'C-02',
    toStage: 'humidity',
    reason: '封套改尺寸，退回控湿等待。',
    operator: '周恬',
    expectedVersion: flow.versionOf('C-02'),
  })
  assert.equal(retried.ok, true)
  assert.equal(flow.latestStageLabel('C-02'), '控湿中')
})

await test('台账包含所有批次且按时间倒序，历史名称保持原样', () => {
  const ledger = flow.ledger.value
  assert.ok(ledger.length >= 3)
  const times = ledger.map((r) => r.at)
  assert.deepEqual(times, [...times].sort().reverse())
  // 历史登记记录的标签仍来自写入快照
  for (const code of ['A-03', 'B-11', 'C-02']) {
    const first = [...flow.recordsFor(code)].sort((a, b) =>
      a.at.localeCompare(b.at),
    )[0]
    assert.equal(first.kind, 'enroll')
    assert.ok(['补纸前', '控湿中', '归档前'].includes(first.toLabel))
  }
})

console.log(`\n全部 ${passed} 项业务层验证通过`)
