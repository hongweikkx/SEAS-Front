import { useQuery } from '@tanstack/react-query'
import { drilldownService } from '@/services/drilldown'

export const useClassSubjectSummary = (examId: string, classId?: number) => {
  return useQuery({
    queryKey: ['classSubjectSummary', examId, classId],
    queryFn: () => drilldownService.getClassSubjectSummary(examId, classId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!classId,
  })
}

export const useSingleClassSummary = (examId: string, subjectId?: string) => {
  return useQuery({
    queryKey: ['singleClassSummary', examId, subjectId],
    queryFn: () => drilldownService.getSingleClassSummary(examId, subjectId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId,
  })
}

export const useSingleClassQuestion = (examId: string, subjectId?: string, classId?: number) => {
  return useQuery({
    queryKey: ['singleClassQuestion', examId, subjectId, classId],
    queryFn: () => drilldownService.getSingleClassQuestion(examId, subjectId!, classId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId && !!classId,
  })
}

export const useSingleQuestionSummary = (examId: string, subjectId?: string) => {
  return useQuery({
    queryKey: ['singleQuestionSummary', examId, subjectId],
    queryFn: () => drilldownService.getSingleQuestionSummary(examId, subjectId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId,
  })
}

export const useSingleQuestionDetail = (
  examId: string, subjectId?: string, classId?: number, questionId?: string
) => {
  return useQuery({
    queryKey: ['singleQuestionDetail', examId, subjectId, classId, questionId],
    queryFn: () => drilldownService.getSingleQuestionDetail(examId, subjectId!, classId!, questionId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId && !!classId && !!questionId,
  })
}
