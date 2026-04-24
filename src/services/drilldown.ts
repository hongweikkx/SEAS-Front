import apiClient from './api'
import type {
  ClassSubjectSummaryResponse,
  SingleClassSummaryResponse,
  SingleClassQuestionResponse,
  SingleQuestionSummaryResponse,
  SingleQuestionDetailResponse,
} from '@/types'

export const drilldownService = {
  // 视图4：班级学科汇总
  getClassSubjectSummary: async (examId: string, classId: number): Promise<ClassSubjectSummaryResponse> =>
    apiClient.get(`/exams/${examId}/classes/${classId}/subjects`),

  // 视图5：单科班级汇总
  getSingleClassSummary: async (examId: string, subjectId: string): Promise<SingleClassSummaryResponse> =>
    apiClient.get(`/exams/${examId}/subjects/${subjectId}/classes`),

  // 视图6：单科班级题目
  getSingleClassQuestion: async (
    examId: string, subjectId: string, classId: number
  ): Promise<SingleClassQuestionResponse> =>
    apiClient.get(`/exams/${examId}/subjects/${subjectId}/classes/${classId}/questions`),

  // 视图7：单科题目汇总
  getSingleQuestionSummary: async (examId: string, subjectId: string): Promise<SingleQuestionSummaryResponse> =>
    apiClient.get(`/exams/${examId}/subjects/${subjectId}/questions`),

  // 视图8：单科班级题目详情
  getSingleQuestionDetail: async (
    examId: string, subjectId: string, classId: number, questionId: string
  ): Promise<SingleQuestionDetailResponse> =>
    apiClient.get(`/exams/${examId}/subjects/${subjectId}/classes/${classId}/questions/${questionId}`),
}
