import * as XLSX from 'xlsx'

export function downloadSimpleTemplate() {
  const data = [
    ['姓名', '班级', '语文', '数学', '英语'],
    ['张三', '一班', 85, 92, 78],
    ['李四', '二班', 90, 88, 95],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '总成绩')
  XLSX.writeFile(wb, '成绩表.xlsx')
}

export function downloadFullTemplate() {
  const wb = XLSX.utils.book_new()

  const summaryData = [
    ['姓名', '班级', '语文', '数学', '英语'],
    ['张三', '一班', 85, 92, 78],
    ['李四', '二班', 90, 88, 95],
  ]
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, '总成绩')

  const chineseData = [
    ['姓名', '班级', '题1', '题2', '总分'],
    ['张三', '一班', 5, 8, 85],
    ['李四', '二班', 7, 6, 88],
  ]
  const chineseWs = XLSX.utils.aoa_to_sheet(chineseData)
  XLSX.utils.book_append_sheet(wb, chineseWs, '语文')

  const mathData = [
    ['姓名', '班级', '题1', '题2', '总分'],
    ['张三', '一班', 6, 9, 92],
    ['李四', '二班', 7, 8, 88],
  ]
  const mathWs = XLSX.utils.aoa_to_sheet(mathData)
  XLSX.utils.book_append_sheet(wb, mathWs, '数学')

  XLSX.writeFile(wb, '成绩表.xlsx')
}
