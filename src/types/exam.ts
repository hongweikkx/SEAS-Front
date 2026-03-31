// 考试相关类型定义
export interface Exam {
  id: string
  name: string
  examDate: string
  createdAt: string
}

export interface ExamsResponse {
  exams: Exam[]
  totalCount: number
  pageIndex: number
  pageSize: number
}

