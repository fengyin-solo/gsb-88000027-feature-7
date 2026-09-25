// 无浏览器环境下的仓库层验证：node test/flowRepository.test.mjs
import assert from 'node:assert/strict'

const store = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
  },
  setTimeout: (fn) => setImmediate(fn),
}

const { flowRepository } = await import('../src/services/flowRepository.js')

const sleep = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

let passed = 0
function test(name, fn) {
  return Promise.resolve(fn()).then(() => {
    passed += 1
    console.log(`✓ ${name}`)
  })
}

await test('初始登记每个批次一条记录，阶段名称为写入时快照', () => {
  const a03 = flowRepository.records.filter((r) => r.code === 'A-03')
  assert.equal(a03.length, 1)
  assert.equal(a03[0].toLabel, '补纸前')
  assert.equal(a03[0].kind, 'enroll')
})

await test('版本号等于该批次已有记录数', () => {
  assert.equal(flowRepository.currentVersion('A-03'), 1)
})

await test('版本匹配时追加成功并持久化，记录为追加式', async () => {
  const record = {
    id: 't1',
    code: 'A-03',
    kind: 'advance',
    fromStage: 'pre-repair',
    toStage: 'humidity',
    fromLabel: '补纸前',
    toLabel: '控湿中',
    reason: '测试推进',
    operator: '测试',
    at: '2026-09-25T10:00:00.000Z',
  }
  const saved = await flowRepository.appendRecord({
    record,
    expectedVersion: 1,
  })
  assert.equal(saved.toLabel, '控湿中')
  assert.equal(flowRepository.currentVersion('A-03'), 2)

  const persisted = JSON.parse(
    store.get('conservation-desk:flow-ledger:v1'),
  )
  const a03 = persisted.records.filter((r) => r.code === 'A-03')
  assert.equal(a03.length, 2)
  // 旧记录名称未被改写
  assert.equal(a03[0].toLabel, '补纸前')
  assert.equal(a03[1].toLabel, '控湿中')
})

await test('并发追加：版本过期时冲突，且不覆盖最近一次有效记录', async () => {
  // 另一终端先写一条（B-11 当前版本 1）
  flowRepository.simulateRemoteAppend({
    id: 'remote-1',
    code: 'B-11',
    kind: 'advance',
    fromStage: 'humidity',
    toStage: 'pre-archive',
    fromLabel: '控湿中',
    toLabel: '归档前',
    reason: '远程先提交',
    operator: '其他终端',
    at: '2026-09-25T10:01:00.000Z',
  })
  assert.equal(flowRepository.currentVersion('B-11'), 2)

  // 本地仍以打开表单时的版本 1 提交
  await assert.rejects(
    flowRepository.appendRecord({
      record: {
        id: 'local-stale',
        code: 'B-11',
        kind: 'rollback',
        fromStage: 'humidity',
        toStage: 'pre-repair',
        fromLabel: '控湿中',
        toLabel: '补纸前',
        reason: '本地过期提交',
        operator: '本地',
        at: '2026-09-25T10:02:00.000Z',
      },
      expectedVersion: 1,
    }),
    (error) => error.code === 'VERSION_CONFLICT',
  )

  const b11 = flowRepository.records.filter((r) => r.code === 'B-11')
  assert.equal(b11.length, 2)
  assert.equal(b11[b11.length - 1].reason, '远程先提交')
})

await test('冲突后用新版本重试同一草稿可以成功', async () => {
  const saved = await flowRepository.appendRecord({
    record: {
      id: 'local-retry',
      code: 'B-11',
      kind: 'rollback',
      fromStage: 'pre-archive',
      toStage: 'humidity',
      fromLabel: '归档前',
      toLabel: '控湿中',
      reason: '核对最新阶段后重试',
      operator: '本地',
      at: '2026-09-25T10:03:00.000Z',
    },
    expectedVersion: 2,
  })
  assert.equal(saved.toLabel, '控湿中')
  assert.equal(flowRepository.currentVersion('B-11'), 3)
})

await test('写入失败：已有记录不丢失也不追加', async () => {
  flowRepository.setFailNextWrite(true)
  const beforeCount = flowRepository.records.filter(
    (r) => r.code === 'C-02',
  ).length
  await assert.rejects(
    flowRepository.appendRecord({
      record: {
        id: 'failed-1',
        code: 'C-02',
        kind: 'rollback',
        fromStage: 'pre-archive',
        toStage: 'humidity',
        fromLabel: '归档前',
        toLabel: '控湿中',
        reason: '注定失败的提交',
        operator: '本地',
        at: '2026-09-25T10:04:00.000Z',
      },
      expectedVersion: 1,
    }),
    (error) => error.code === 'WRITE_FAILED',
  )
  const afterCount = flowRepository.records.filter(
    (r) => r.code === 'C-02',
  ).length
  assert.equal(afterCount, beforeCount)
  // failNextWrite 只影响一次
  assert.equal(flowRepository.failNextWrite, false)
})

await sleep()
console.log(`\n全部 ${passed} 项仓库层验证通过`)
