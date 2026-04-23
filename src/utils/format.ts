import type { RatingConfig } from '@/types'

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
export const getGradeLevel = (score: number, config?: RatingConfig): string => {
  const excellentThreshold = config?.excellent_threshold ?? 90
  const goodThreshold = config?.good_threshold ?? 70
  const passThreshold = config?.pass_threshold ?? 60

  if (score >= excellentThreshold) return '优秀'
  if (score >= goodThreshold) return '良好'
  if (score >= passThreshold) return '合格'
  return '低分'
}

// 获取成绩等级颜色
export const getGradeLevelColor = (score: number, config?: RatingConfig): string => {
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

// 难度标签映射
export const difficultyLabel: Record<string, { label: string; className: string }> = {
  easy: { label: '易', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: '中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '难', className: 'bg-red-50 text-red-700 border-red-200' },
}

// 考试分类检测
export function detectExamType(name: string): '期中' | '期末' | '月考' | '模拟' | '其他' {
  if (name.includes('期中')) return '期中'
  if (name.includes('期末')) return '期末'
  if (name.includes('月考')) return '月考'
  if (name.includes('模拟') || name.includes('模考')) return '模拟'
  return '其他'
}

// 分类标签颜色
export const examTypeColors: Record<string, string> = {
  期中: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  期末: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  月考: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  模拟: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  其他: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
} as const
