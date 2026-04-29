import * as XLSX from 'xlsx'

export interface ParsedStudent {
  name: string
  className: string
  scores: Record<string, number>
}

export interface ParsedSubjectDetail {
  subjectName: string
  questions: string[]
  studentScores: Record<string, Record<string, number>> // studentName -> {题1: 5, 题2: 8, 总分: 85}
}

export interface ParseResult {
  mode: 'simple' | 'full'
  summarySheet: string
  subjects: string[]
  students: ParsedStudent[]
  subjectDetails: ParsedSubjectDetail[]
  warnings: string[]
  // 新增：各科默认满分
  subjectFullScores: Record<string, number>
}

export function parseExamExcel(arrayBuffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheets = workbook.SheetNames

  if (sheets.length === 0) {
    throw new Error('Excel 文件中没有 Sheet')
  }

  const result: ParseResult = {
    mode: 'simple',
    summarySheet: sheets[0],
    subjects: [],
    students: [],
    subjectDetails: [],
    warnings: [],
  }

  // 确定总成绩 sheet
  for (const sheetName of sheets) {
    if (sheetName.trim() === '总成绩') {
      result.summarySheet = sheetName
      break
    }
  }

  // 解析总成绩表
  const summaryWs = workbook.Sheets[result.summarySheet]
  const summaryRows = XLSX.utils.sheet_to_json<string[]>(summaryWs, { header: 1 })

  if (summaryRows.length < 2) {
    throw new Error('总成绩表数据不足，至少需要表头+1行数据')
  }

  const headers = summaryRows[0].map(h => String(h).trim())
  const nameIdx = headers.indexOf('姓名')
  const classIdx = headers.indexOf('班级')

  if (nameIdx === -1) {
    throw new Error('未识别到「姓名」列，请检查表头')
  }
  if (classIdx === -1) {
    throw new Error('未识别到「班级」列，请检查表头')
  }

  // 识别学科列（排除姓名、班级后的列）
  const subjectCols: { index: number; name: string }[] = []
  for (let i = 0; i < headers.length; i++) {
    if (i !== nameIdx && i !== classIdx && headers[i]) {
      subjectCols.push({ index: i, name: headers[i] })
      result.subjects.push(headers[i])
    }
  }

  if (subjectCols.length === 0) {
    throw new Error('未识别到学科成绩列，请检查表头格式')
  }

  // 初始化各科默认满分为 100
  result.subjectFullScores = {}
  for (const { name: subjectName } of subjectCols) {
    result.subjectFullScores[subjectName] = 100
  }

  // 解析学生数据
  for (let i = 1; i < summaryRows.length; i++) {
    const row = summaryRows[i]
    if (!row || row.length === 0) continue

    const name = String(row[nameIdx] ?? '').trim()
    const className = String(row[classIdx] ?? '').trim()
    if (!name) continue

    const scores: Record<string, number> = {}
    for (const { index, name: subjectName } of subjectCols) {
      if (index < row.length) {
        const val = row[index]
        if (val !== undefined && val !== '') {
          const num = Number(val)
          if (!isNaN(num)) {
            scores[subjectName] = num
          }
        }
      }
    }

    result.students.push({ name, className, scores })
  }

  // 检查是否有科目明细 sheet
  const detailSheets = sheets.filter(s => s !== result.summarySheet)
  const subjectDetailMap = new Map<string, ParsedSubjectDetail>()

  for (const sheetName of detailSheets) {
    // 尝试匹配学科名
    const matchedSubject = result.subjects.find(s =>
      s === sheetName || s.replace(/\s/g, '') === sheetName.replace(/\s/g, '')
    )

    if (!matchedSubject) {
      result.warnings.push(`Sheet「${sheetName}」未匹配到对应学科，已忽略`)
      continue
    }

    const ws = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })

    if (rows.length < 2) {
      result.warnings.push(`Sheet「${sheetName}」数据不足，已忽略`)
      continue
    }

    const itemHeaders = rows[0].map(h => String(h).trim())
    const itemNameIdx = itemHeaders.indexOf('姓名')

    if (itemNameIdx === -1) {
      result.warnings.push(`Sheet「${sheetName}」未找到「姓名」列，已忽略`)
      continue
    }

    // 识别题目列和总分列
    const questionCols: { index: number; name: string }[] = []
    let totalScoreIdx = -1

    for (let i = 0; i < itemHeaders.length; i++) {
      if (i === itemNameIdx) continue
      const h = itemHeaders[i]
      if (h === '总分') {
        totalScoreIdx = i
      } else if (h.startsWith('题')) {
        questionCols.push({ index: i, name: h })
      }
    }

    const detail: ParsedSubjectDetail = {
      subjectName: matchedSubject,
      questions: questionCols.map(q => q.name),
      studentScores: {},
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length === 0) continue

      const studentName = String(row[itemNameIdx] ?? '').trim()
      if (!studentName) continue

      const scores: Record<string, number> = {}
      for (const { index, name: qName } of questionCols) {
        if (index < row.length) {
          const val = row[index]
          if (val !== undefined && val !== '') {
            const num = Number(val)
            if (!isNaN(num)) {
              scores[qName] = num
            }
          }
        }
      }

      if (totalScoreIdx !== -1 && totalScoreIdx < row.length) {
        const val = row[totalScoreIdx]
        if (val !== undefined && val !== '') {
          const num = Number(val)
          if (!isNaN(num)) {
            scores['总分'] = num
          }
        }
      }

      detail.studentScores[studentName] = scores
    }

    subjectDetailMap.set(matchedSubject, detail)
  }

  result.subjectDetails = Array.from(subjectDetailMap.values())
  if (result.subjectDetails.length > 0) {
    result.mode = 'full'
  }

  return result
}

export function getUniqueClasses(students: ParsedStudent[]): string[] {
  const set = new Set<string>()
  for (const s of students) {
    if (s.className) set.add(s.className)
  }
  return Array.from(set)
}
