// 格式化日期
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

// 格式化数字到2位小数
export const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num
  return isNaN(n) ? '0.00' : n.toFixed(2)
}

// 获取难度等级描述
export const getDifficultyLevel = (difficulty: number): string => {
  if (difficulty >= 80) return '简单'
  if (difficulty >= 60) return '中等'
  if (difficulty >= 40) return '困难'
  return '很困难'
}

// 获取难度等级颜色
export const getDifficultyColor = (difficulty: number): string => {
  if (difficulty >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (difficulty >= 60) return 'text-amber-600 dark:text-amber-400'
  if (difficulty >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-destructive'
}

// 获取成绩等级
export const getGradeLevel = (score: number, config?: any): string => {
  const excellentThreshold = config?.excellent_threshold ?? 90
  const goodThreshold = config?.good_threshold ?? 70
  const passThreshold = config?.pass_threshold ?? 60

  if (score >= excellentThreshold) return '优秀'
  if (score >= goodThreshold) return '良好'
  if (score >= passThreshold) return '合格'
  return '低分'
}

// 获取成绩等级颜色
export const getGradeLevelColor = (score: number, config?: any): string => {
  const excellentThreshold = config?.excellent_threshold ?? 90
  const goodThreshold = config?.good_threshold ?? 70
  const passThreshold = config?.pass_threshold ?? 60

  if (score >= excellentThreshold) {
    return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
  }
  if (score >= goodThreshold) {
    return 'bg-primary/15 text-primary'
  }
  if (score >= passThreshold) {
    return 'bg-amber-500/15 text-amber-900 dark:text-amber-200'
  }
  return 'bg-destructive/15 text-destructive'
}

/** 四率表格中各等级的徽章样式（与主题 token 一致） */
export const ratingTierBadgeClass = {
  excellent:
    'rounded bg-emerald-500/15 px-2 py-1 text-emerald-800 dark:text-emerald-300',
  good: 'rounded bg-primary/15 px-2 py-1 text-primary',
  pass: 'rounded bg-amber-500/15 px-2 py-1 text-amber-900 dark:text-amber-200',
  fail: 'rounded bg-destructive/15 px-2 py-1 text-destructive',
} as const

