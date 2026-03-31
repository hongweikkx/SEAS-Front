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
  if (difficulty >= 80) return 'text-green-600'
  if (difficulty >= 60) return 'text-yellow-600'
  if (difficulty >= 40) return 'text-orange-600'
  return 'text-red-600'
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

  if (score >= excellentThreshold) return 'bg-green-100 text-green-800'
  if (score >= goodThreshold) return 'bg-blue-100 text-blue-800'
  if (score >= passThreshold) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

