import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnalysisView, DrillDownNode, RatingConfig, AIAnalysisResult } from '@/types'

export type ExamType = '期中' | '期末' | '月考' | '模拟' | '其他'

interface AnalysisState {
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  activeDetailSection: 'class-overview' | 'subject-compare' | 'custom'
  selectedExamId: string | null
  selectedExamName: string | null
  selectedSubjectId: string | null
  selectedSubjectName: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  ratingConfig: RatingConfig
  classSummaryConfig: { showDeviation: boolean; showStdDev: boolean }
  subjectSummaryConfig: { showDifficulty: boolean; showStudentCount: boolean }
  currentView: AnalysisView
  drillDownPath: DrillDownNode[]
  drillDownParams: {
    classId?: string
    subjectId?: string
    questionId?: string
  }

  setAuthenticated: (isAuthenticated: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveDetailSection: (section: 'class-overview' | 'subject-compare' | 'custom') => void
  setSelectedExamId: (examId: string) => void
  setSelectedExamName: (examName: string | null) => void
  setSelectedSubjectId: (subjectId: string | null) => void
  setSelectedSubjectName: (subjectName: string | null) => void
  setSelectedScope: (scope: 'all_subjects' | 'single_subject') => void
  setRatingConfig: (config: RatingConfig) => void
  setClassSummaryConfig: (config: Partial<AnalysisState['classSummaryConfig']>) => void
  setSubjectSummaryConfig: (config: Partial<AnalysisState['subjectSummaryConfig']>) => void
  setCurrentView: (view: AnalysisView) => void
  pushDrillDown: (node: DrillDownNode) => void
  popDrillDownTo: (view: AnalysisView) => void
  setDrillDownParam: (key: keyof AnalysisState['drillDownParams'], value: string | undefined) => void
  resetDrillDown: () => void
  updateLastDrillDownLabel: (label: string) => void

  aiAnalysisResults: Record<string, AIAnalysisResult | null>
  aiAnalysisLoading: Record<string, boolean>
  generateAIAnalysis: (view: AnalysisView, examId: string, params: AnalysisState['drillDownParams']) => Promise<void>
  clearAIAnalysis: (view: AnalysisView, examId: string) => void
  executeAILink: (link: import('@/types').AILink) => void

  reset: () => void
}

const defaultState = {
  isAuthenticated: false,
  sidebarCollapsed: false,
  activeDetailSection: 'class-overview' as const,
  selectedExamId: null as string | null,
  selectedExamName: null as string | null,
  selectedSubjectId: null as string | null,
  selectedSubjectName: null as string | null,
  selectedScope: 'all_subjects' as const,
  ratingConfig: {
    excellent_threshold: 85,
    good_threshold: 76,
    medium_threshold: 68,
    pass_threshold: 60,
    low_score_threshold: 40,
  },
  classSummaryConfig: { showDeviation: true, showStdDev: true },
  subjectSummaryConfig: { showDifficulty: true, showStudentCount: true },
  currentView: 'class-summary' as AnalysisView,
  drillDownPath: [] as DrillDownNode[],
  drillDownParams: {} as AnalysisState['drillDownParams'],
  aiAnalysisResults: {} as Record<string, AIAnalysisResult | null>,
  aiAnalysisLoading: {} as Record<string, boolean>,
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setActiveDetailSection: (activeDetailSection) => set({ activeDetailSection }),
      setSelectedExamId: (examId) => set({ selectedExamId: examId }),
      setSelectedExamName: (selectedExamName) => set({ selectedExamName }),
      setSelectedSubjectId: (selectedSubjectId) => set({ selectedSubjectId }),
      setSelectedSubjectName: (selectedSubjectName) => set({ selectedSubjectName }),
      setSelectedScope: (scope) => set({ selectedScope: scope }),
      setRatingConfig: (config) => set({ ratingConfig: config }),
      setClassSummaryConfig: (config) =>
        set((state) => ({ classSummaryConfig: { ...state.classSummaryConfig, ...config } })),
      setSubjectSummaryConfig: (config) =>
        set((state) => ({ subjectSummaryConfig: { ...state.subjectSummaryConfig, ...config } })),

      setCurrentView: (currentView) => set({ currentView }),

      pushDrillDown: (node) =>
        set((state) => ({
          drillDownPath: [...state.drillDownPath, node],
        })),

      popDrillDownTo: (view) =>
        set((state) => {
          const index = state.drillDownPath.findIndex((n) => n.view === view)
          if (index === -1) return { drillDownPath: [] }
          return {
            drillDownPath: state.drillDownPath.slice(0, index + 1),
          }
        }),

      setDrillDownParam: (key, value) =>
        set((state) => ({
          drillDownParams: { ...state.drillDownParams, [key]: value },
        })),

      resetDrillDown: () =>
        set({
          drillDownPath: [],
          drillDownParams: {},
        }),

      updateLastDrillDownLabel: (label) =>
        set((state) => {
          if (state.drillDownPath.length === 0) return state
          const newPath = [...state.drillDownPath]
          newPath[newPath.length - 1] = { ...newPath[newPath.length - 1], label }
          return { drillDownPath: newPath }
        }),

      generateAIAnalysis: async (view, examId, params) => {
        const key = `${examId}:${view}`
        set((state) => ({
          aiAnalysisLoading: { ...state.aiAnalysisLoading, [key]: true },
        }))
        try {
          const { aiAnalysisService } = await import('@/services/aiAnalysis')
          const result = await aiAnalysisService.generate(view, examId, params)
          set((state) => ({
            aiAnalysisResults: { ...state.aiAnalysisResults, [key]: result },
          }))
        } catch (err) {
          console.error('AI analysis failed:', err)
          set((state) => ({
            aiAnalysisResults: {
              ...state.aiAnalysisResults,
              [key]: {
                segments: [{ type: 'text' as const, content: '智能分析服务暂时不可用，请稍后重试。' }],
                generatedAt: Date.now(),
              },
            },
          }))
        } finally {
          set((state) => ({
            aiAnalysisLoading: { ...state.aiAnalysisLoading, [key]: false },
          }))
        }
      },

      clearAIAnalysis: (view, examId) => {
        const key = `${examId}:${view}`
        set((state) => ({
          aiAnalysisResults: { ...state.aiAnalysisResults, [key]: null },
        }))
      },

      executeAILink: (link) => {
        const { targetView, params } = link
        const state = get()

        if (params?.classId) state.setDrillDownParam('classId', params.classId)
        if (params?.subjectId) {
          state.setDrillDownParam('subjectId', params.subjectId)
          state.setSelectedSubjectId(params.subjectId)
          state.setSelectedScope('single_subject')
        }
        if (params?.questionId) state.setDrillDownParam('questionId', params.questionId)

        const singleSubjectViews: AnalysisView[] = [
          'single-class-summary',
          'single-class-question',
          'single-question-summary',
          'single-question-detail',
        ]
        if (singleSubjectViews.includes(targetView)) {
          state.setSelectedScope('single_subject')
        }

        state.pushDrillDown({
          view: targetView,
          label: `智能分析${link.label}`,
          params,
        })
        state.setCurrentView(targetView)
      },

      reset: () => set({ ...defaultState }),
    }),
    {
      name: 'analysis-store-ai',
      partialize: (state) => ({ aiAnalysisResults: state.aiAnalysisResults }),
    }
  )
)
