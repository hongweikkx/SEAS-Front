import apiClient from './api'
import type {
  ExamsResponse,
  SubjectsResponse,
  SubjectSummaryResponse,
  ClassSummaryResponse,
  RatingDistributionResponse,
  RatingConfig,
} from '@/types'

export const examService = {
  // 获取考试列表
  listExams: (pageIndex: number = 1, pageSize: number = 20, keyword?: string): Promise<ExamsResponse> =>
    apiClient.get('/exams', {
      params: { page_index: pageIndex, page_size: pageSize, ...(keyword && { keyword }) },
    }),

  // 获取考试关联的学科列表
  listSubjects: (examId: string, pageIndex: number = 1, pageSize: number = 20): Promise<SubjectsResponse> =>
    apiClient.get(`/exams/${examId}/subjects`, {
      params: { page_index: pageIndex, page_size: pageSize },
    }),

  // 删除考试
  deleteExam: (examId: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/exams/${examId}`),
}

export const analysisService = {
  // 获取学科汇总
  getSubjectSummary: (
    examId: string,
    scope: 'all_subjects' | 'single_subject',
    subjectId?: string
  ): Promise<SubjectSummaryResponse> =>
    apiClient.get(`/exams/${examId}/analysis/subject-summary`, {
      params: {
        scope,
        ...(subjectId && { subject_id: subjectId }),
      },
    }),

  // 获取班级汇总
  getClassSummary: (
    examId: string,
    scope: 'all_subjects' | 'single_subject',
    subjectId?: string
  ): Promise<ClassSummaryResponse> =>
    apiClient.get(`/exams/${examId}/analysis/class-summary`, {
      params: {
        scope,
        ...(subjectId && { subject_id: subjectId }),
      },
    }),

  // 获取四率分析
  getRatingDistribution: (
    examId: string,
    scope: 'all_subjects' | 'single_subject',
    config?: RatingConfig,
    subjectId?: string
  ): Promise<RatingDistributionResponse> =>
    apiClient.get(`/exams/${examId}/analysis/rating-distribution`, {
      params: {
        scope,
        ...(subjectId && { subject_id: subjectId }),
        ...(config && {
          excellent_threshold: config.excellent_threshold,
          good_threshold: config.good_threshold,
          medium_threshold: config.medium_threshold,
          pass_threshold: config.pass_threshold,
          low_score_threshold: config.low_score_threshold,
        }),
      },
    }),
}

