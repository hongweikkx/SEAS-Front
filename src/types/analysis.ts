export type AnalysisView =
  | 'class-summary'
  | 'subject-summary'
  | 'rating-analysis'
  | 'single-class-summary'
  | 'single-class-question'
  | 'single-question-summary'
  | 'single-question-detail'

export interface DrillDownNode {
  view: AnalysisView
  label: string
  params?: Record<string, string>
}

// 学科相关类型定义
export interface Subject {
  id: string
  name: string
}

export interface SubjectsResponse {
  subjects: Subject[]
  total: number
  pageIndex: number
  pageSize: number
}

// 学科汇总相关类型定义
export interface SubjectSummary {
  id: string
  name: string
  fullScore: number
  avgScore: number
  highestScore: number
  lowestScore: number
  difficulty: number
  studentCount: number
  scoreDeviation: number
  stdDev: number
  discrimination: number
}

export interface SubjectSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  subjectsInvolved?: number
  classesInvolved?: number
  overall?: SubjectSummary
  subjects: SubjectSummary[]
}

// 班级汇总相关类型定义
export interface ClassSummary {
  classId: number
  className: string
  totalStudents: number
  fullScore: number
  avgScore: number
  highestScore: number
  lowestScore: number
  scoreDeviation: number
  difficulty: number
  stdDev: number
  discrimination: number
}

export interface ClassSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  overallGrade: ClassSummary
  classDetails: ClassSummary[]
}

// 四率相关类型定义
export interface RatingItem {
  count: number
  percentage: number
}

export interface ClassRatingDistribution {
  classId: number
  className: string
  totalStudents: number
  avgScore: number
  excellent: RatingItem
  good: RatingItem
  pass: RatingItem
  fail: RatingItem
}

export interface RatingConfig {
  excellent_threshold: number
  good_threshold: number
  pass_threshold: number
}

export interface RatingDistributionResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  config: RatingConfig
  overallGrade: ClassRatingDistribution
  classDetails: ClassRatingDistribution[]
}

