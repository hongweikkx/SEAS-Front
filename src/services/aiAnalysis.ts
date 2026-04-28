import apiClient from './api'
import type { AnalysisView, AIAnalysisResult } from '@/types'

export const aiAnalysisService = {
  generate: (
    view: AnalysisView,
    examId: string,
    params?: Record<string, string>
  ): Promise<AIAnalysisResult> =>
    apiClient.post('/ai/analysis', { view, examId, params }),
}
