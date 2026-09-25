export const restorationNavigation = [
  { label: '修复总览', to: '/' },
  { label: '批次档案', to: '/batches' },
  { label: '任务清单', to: '/tasks' },
  { label: '流转台账', to: '/flows' },
]

export const restorationHero = {
  title: '古籍虫蛀修复批次板',
  description:
    '聚焦修复批次、控湿参数和文献归档风险，适合作为修复工作室内部业务系统的前端原型。',
  backlogLabel: '待处理批次',
  backlogValue: '12 册',
  note: '高湿季节前优先清理虫道扩散页。',
}

// 修复阶段按办理顺序排列；流转只允许在相邻阶段之间推进或回退。
export const restorationStages = [
  { key: 'pre-repair', label: '补纸前' },
  { key: 'humidity', label: '控湿中' },
  { key: 'pre-archive', label: '归档前' },
]

export const restorationBatches = [
  {
    code: 'A-03',
    title: '明抄本县志残卷',
    pages: '17-29',
    risk: 'high',
    initialStage: 'pre-repair',
    note: '虫道集中在装订线外沿。',
  },
  {
    code: 'B-11',
    title: '碑帖拓片册页',
    pages: '5-14',
    risk: 'medium',
    initialStage: 'humidity',
    note: '需先降湿 48 小时，再进入纤维加固。',
  },
  {
    code: 'C-02',
    title: '戏曲抄本散页',
    pages: '1-9',
    risk: 'low',
    initialStage: 'pre-archive',
    note: '边角缺损明显，建议先做透明托裱。',
  },
]

// 历史批次在登记时的阶段名称快照。阶段显示一律取自记录里的快照，
// 即使后续调整阶段表的命名，历史批次和历史记录仍沿用原有名称。
const stageLabelSnapshot = Object.fromEntries(
  restorationStages.map((stage) => [stage.key, stage.label]),
)

// 演示用的初始流水：一条记录代表批次登记入库（每个批次的最早有效记录）。
export const restorationSeedFlows = restorationBatches.map((batch, index) => ({
  id: `seed-${batch.code}`,
  code: batch.code,
  kind: 'enroll',
  fromStage: null,
  toStage: batch.initialStage,
  // 阶段名称在记录写入时固化，之后任何新记录都不会改写它。
  fromLabel: null,
  toLabel: stageLabelSnapshot[batch.initialStage],
  reason: '批次登记建档，确认当前修复阶段。',
  operator: '修复室',
  at: new Date(2026, 8, 18, 9 + index, 15).toISOString(),
}))

export const restorationEnvironment = [
  {
    label: '相对湿度',
    value: '52%',
    note: '控制线 50% - 55%',
  },
  {
    label: '纸浆补配',
    value: '2 批',
    note: '桑皮纤维待过滤',
  },
  {
    label: '紫外检查',
    value: '4 页',
    note: '夜间统一复核霉斑残留',
  },
]

export const restorationSteps = [
  '拍照建档并标注虫蛀起止页。',
  '低压吸附除尘，保留边角碎纤维。',
  '喷雾回软后局部补纸，不做整页过度清洗。',
  '平整定型 8 小时后转入无酸盒暂存。',
]

export const restorationTasks = [
  {
    code: 'A-03',
    title: '明抄本县志残卷',
    risk: 'high',
    owner: '韩澈',
    note: '虫道贯穿标题栏，需先固色。',
  },
  {
    code: 'B-11',
    title: '碑帖拓片册页',
    risk: 'medium',
    owner: '陆宁',
    note: '边缘卷曲，可延后压平。',
  },
  {
    code: 'C-02',
    title: '戏曲抄本散页',
    risk: 'low',
    owner: '周恬',
    note: '等待封套尺寸确认。',
  },
]
