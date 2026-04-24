import type { AnalysisView } from '@/store/analysisStore'

/** 可点击词的跳转协议 */
export interface AILink {
  /** 显示的文字 */
  label: string
  /** 目标视图 */
  targetView: AnalysisView
  /** 跳转时携带的参数 */
  params?: {
    classId?: string
    subjectId?: string
    questionId?: string
  }
}

/** AI 分析结果 */
export interface AIAnalysisResult {
  segments: Array<
    | { type: 'text'; content: string }
    | { type: 'link'; content: string; link: AILink }
  >
  /** 生成时间戳 */
  generatedAt: number
}
