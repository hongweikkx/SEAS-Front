import apiClient from './api'
import type {
  ClassSubjectSummaryResponse,
  SingleClassSummaryResponse,
  SingleClassQuestionResponse,
  SingleQuestionSummaryResponse,
  SingleQuestionDetailResponse,
  SingleQuestionClassCompareResponse,
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

  // 视图9：试题班级对比
  getSingleQuestionClassCompare: async (
    examId: string, subjectId: string, questionId: string
  ): Promise<SingleQuestionClassCompareResponse> => {
    // Mock 数据,后端就绪后切换为真实 API
    await new Promise((resolve) => setTimeout(resolve, 300))
    const fullScore = 10
    return {
      examId,
      examName: '模拟考试',
      subjectId,
      subjectName: '数学',
      questionId,
      questionNumber: questionId,
      questionType: '解答题',
      fullScore,
      questionContent: '这是一道示例题目,用于测试试题班级对比功能。',
      overall: {
        classId: 0,
        className: '全年级',
        participants: 150,
        avgScore: 7.2,
        scoreRate: 72,
        scoreDiff: 0,
        classRank: null,
        totalClasses: 3,
        highestScore: 10,
        lowestScore: 0,
        stdDev: 1.45,
      },
      classes: [
        { classId: 1, className: '一班', participants: 50, avgScore: 7.5, scoreRate: 75, scoreDiff: 0.3, classRank: 1, totalClasses: 3, highestScore: 10, lowestScore: 2, stdDev: 1.32 },
        { classId: 2, className: '二班', participants: 49, avgScore: 7.0, scoreRate: 70, scoreDiff: -0.2, classRank: 2, totalClasses: 3, highestScore: 10, lowestScore: 1, stdDev: 1.51 },
        { classId: 3, className: '三班', participants: 51, avgScore: 5.1, scoreRate: 51, scoreDiff: -2.1, classRank: 3, totalClasses: 3, highestScore: 9, lowestScore: 0, stdDev: 1.78 },
      ],
    }
  },
}
