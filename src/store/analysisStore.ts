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

  aiAnalysisResults: Record<AnalysisView, AIAnalysisResult | null>
  aiAnalysisLoading: Record<AnalysisView, boolean>
  generateAIAnalysis: (view: AnalysisView, examId: string, params: AnalysisState['drillDownParams']) => Promise<void>
  clearAIAnalysis: (view: AnalysisView) => void
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
    excellent_threshold: 90,
    good_threshold: 70,
    pass_threshold: 60,
  },
  classSummaryConfig: { showDeviation: true, showStdDev: true },
  subjectSummaryConfig: { showDifficulty: true, showStudentCount: true },
  currentView: 'class-summary' as AnalysisView,
  drillDownPath: [] as DrillDownNode[],
  drillDownParams: {} as AnalysisState['drillDownParams'],
  aiAnalysisResults: {
    'class-summary': null,
    'subject-summary': null,
    'rating-analysis': null,
    'class-subject-summary': null,
    'single-class-summary': null,
    'single-class-question': null,
    'single-question-summary': null,
    'single-question-detail': null,
  } as Record<AnalysisView, AIAnalysisResult | null>,
  aiAnalysisLoading: {
    'class-summary': false,
    'subject-summary': false,
    'rating-analysis': false,
    'class-subject-summary': false,
    'single-class-summary': false,
    'single-class-question': false,
    'single-question-summary': false,
    'single-question-detail': false,
  } as Record<AnalysisView, boolean>,
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

      generateAIAnalysis: async (view, examId, params) => {
        set((state) => ({
          aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: true },
        }))
        try {
          const { generateMockAIAnalysis } = await import('@/mocks/aiAnalysis')
          await new Promise((r) => setTimeout(r, 500))
          const result = generateMockAIAnalysis(view, examId, params)
          set((state) => ({
            aiAnalysisResults: { ...state.aiAnalysisResults, [view]: result },
          }))
        } finally {
          set((state) => ({
            aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: false },
          }))
        }
      },

      clearAIAnalysis: (view) =>
        set((state) => ({
          aiAnalysisResults: { ...state.aiAnalysisResults, [view]: null },
        })),

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
          label: link.label,
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
