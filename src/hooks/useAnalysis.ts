import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { examService, analysisService } from '@/services/analysis'
import type { RatingConfig } from '@/types'

/** 与 useRatingDistribution 一致，供手动 fetch / invalidate 使用 */
export const ratingDistributionQueryKey = (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  config: RatingConfig | undefined,
  subjectId?: string
) =>
  [
    'ratingDistribution',
    examId,
    scope,
    config?.excellent_threshold,
    config?.good_threshold,
    config?.medium_threshold,
    config?.pass_threshold,
    config?.low_score_threshold,
    subjectId,
  ] as const

// 获取考试列表
export const useExams = (pageIndex: number = 1, pageSize: number = 20, keyword?: string) => {
  return useQuery({
    queryKey: ['exams', pageIndex, pageSize, keyword],
    queryFn: () => examService.listExams(pageIndex, pageSize, keyword),
    staleTime: 10 * 1000, // 10秒缓存，列表数据需要较新鲜
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
    enabled: !!examId && (scope !== 'single_subject' || !!subjectId),
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
    enabled: !!examId && (scope !== 'single_subject' || !!subjectId),
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
    queryKey: ratingDistributionQueryKey(examId, scope, config, subjectId),
    queryFn: () => analysisService.getRatingDistribution(examId, scope, config, subjectId),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && (scope !== 'single_subject' || !!subjectId),
    placeholderData: keepPreviousData,
  })
}

