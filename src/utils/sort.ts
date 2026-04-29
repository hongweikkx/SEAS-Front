/**
 * 按班级名称自然数顺序排序（如 1班、2班、10班）
 */
export function sortByClassName<T extends { className: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const numA = Number(a.className.match(/^\d+/)?.[0] ?? 0)
    const numB = Number(b.className.match(/^\d+/)?.[0] ?? 0)
    if (numA !== numB) return numA - numB
    return a.className.localeCompare(b.className)
  })
}

// 标准科目顺序：列表中的排前面，未在列表中的排在最后
const SUBJECT_ORDER = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

function getSubjectOrder(name: string): number {
  const idx = SUBJECT_ORDER.indexOf(name)
  return idx === -1 ? SUBJECT_ORDER.length : idx
}

/**
 * 按标准科目顺序排序（适用于有 name 字段的对象）
 */
export function sortBySubjectName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => getSubjectOrder(a.name) - getSubjectOrder(b.name))
}

/**
 * 按标准科目顺序排序（适用于有 subjectName 字段的对象）
 */
export function sortBySubjectItemName<T extends { subjectName: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => getSubjectOrder(a.subjectName) - getSubjectOrder(b.subjectName))
}
