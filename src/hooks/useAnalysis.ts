import { useQuery } from '@tanstack/react-query'
import { examService, analysisService } from '@/services/analysis'
import type { RatingConfig } from '@/types'

// 获取考试列表
export const useExams = (pageIndex: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['exams', pageIndex, pageSize],
    queryFn: () => examService.listExams(pageIndex, pageSize),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 获取学科列表
export const useSubjects = (examId: string, pageIndex: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['subjects', examId, pageIndex, pageSize],
    queryFn: () => examService.listSubjects(examId, pageIndex, pageSize),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId,
  })
}

// 获取学科汇总
export const useSubjectSummary = (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  subjectId?: string
) => {
  return useQuery({
    queryKey: ['subjectSummary', examId, scope, subjectId],
    queryFn: () => analysisService.getSubjectSummary(examId, scope, subjectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId,
  })
}

// 获取班级汇总
export const useClassSummary = (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  subjectId?: string
) => {
  return useQuery({
    queryKey: ['classSummary', examId, scope, subjectId],
    queryFn: () => analysisService.getClassSummary(examId, scope, subjectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId,
  })
}

// 获取四率分析
export const useRatingDistribution = (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  config?: RatingConfig,
  subjectId?: string
) => {
  return useQuery({
    queryKey: ['ratingDistribution', examId, scope, config, subjectId],
    queryFn: () => analysisService.getRatingDistribution(examId, scope, config, subjectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId,
  })
}

