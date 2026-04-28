// 视图3：班级学科汇总
export interface ClassSubjectItem {
  subjectId: string
  subjectName: string
  studentCount: number
  fullScore: number
  classAvgScore: number
  gradeAvgScore: number
  scoreDiff: number
  classHighest: number
  classLowest: number
  classRank: number
  totalClasses: number
  difficulty: number
  stdDev: number
  discrimination: number
}

export interface ClassSubjectSummaryResponse {
  examId: string
  examName: string
  classId: number
  className: string
  overall: ClassSubjectItem  // 全科行
  subjects: ClassSubjectItem[]
}

// 视图4：单科班级汇总（复用 ClassSummary 结构）
export interface SingleClassSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  overall: import('./analysis').ClassSummary  // 全年级行
  classes: import('./analysis').ClassSummary[]
}

// 视图5：单科班级题目
export interface ClassQuestionItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  classAvgScore: number
  scoreRate: number
  gradeAvgScore: number
  difficulty: number
}

export interface SingleClassQuestionResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  classId: number
  className: string
  questions: ClassQuestionItem[]
}

// 视图6：单科题目汇总
export interface QuestionClassBreakdown {
  classId: number
  className: string
  avgScore: number
}

export interface SingleQuestionSummaryItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  gradeAvgScore: number
  classBreakdown: QuestionClassBreakdown[]
  scoreRate: number
  difficulty: number
}

export interface SingleQuestionSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  questions: SingleQuestionSummaryItem[]
}

// 视图7：单科班级题目详情
export interface StudentQuestionDetail {
  studentId: string
  studentName: string
  score: number
  fullScore: number
  scoreRate: number
  classRank: number
  gradeRank: number
  answerContent?: string
}

export interface SingleQuestionDetailResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  classId: number
  className: string
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  questionContent?: string
  students: StudentQuestionDetail[]
}
