import { create } from 'zustand'
import type { RatingConfig } from '@/types'

export type AnalysisModule =
  | 'subject-summary'
  | 'class-summary'
  | 'rating-analysis'
  | 'critical-students'
  | 'score-fluctuation'

export type ExamType = '期中' | '期末' | '月考' | '模拟' | '其他'

export type AnalysisView =
  | 'class-summary'
  | 'subject-summary'
  | 'rating-analysis'
  | 'class-subject-summary'
  | 'single-class-summary'
  | 'single-class-question'
  | 'single-question-summary'
  | 'single-question-detail'

export interface DrillDownNode {
  view: AnalysisView
  label: string
  params?: Record<string, string>
}

interface AnalysisState {
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  activeDetailSection: 'class-overview' | 'subject-compare' | 'custom'
  selectedExamId: string | null
  selectedExamName: string | null
  selectedSubjectId: string | null
  selectedSubjectName: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  activeAnalysisModule: AnalysisModule
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
  setActiveAnalysisModule: (module: AnalysisModule) => void
  setRatingConfig: (config: RatingConfig) => void
  setClassSummaryConfig: (config: Partial<AnalysisState['classSummaryConfig']>) => void
  setSubjectSummaryConfig: (config: Partial<AnalysisState['subjectSummaryConfig']>) => void
  setCurrentView: (view: AnalysisView) => void
  pushDrillDown: (node: DrillDownNode) => void
  popDrillDownTo: (view: AnalysisView) => void
  setDrillDownParam: (key: keyof AnalysisState['drillDownParams'], value: string | undefined) => void
  resetDrillDown: () => void
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
  activeAnalysisModule: 'subject-summary' as AnalysisModule,
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
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...defaultState,

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setActiveDetailSection: (activeDetailSection) => set({ activeDetailSection }),
  setSelectedExamId: (examId) => set({ selectedExamId: examId }),
  setSelectedExamName: (selectedExamName) => set({ selectedExamName }),
  setSelectedSubjectId: (selectedSubjectId) => set({ selectedSubjectId }),
  setSelectedSubjectName: (selectedSubjectName) => set({ selectedSubjectName }),
  setSelectedScope: (scope) => set({ selectedScope: scope }),
  setActiveAnalysisModule: (activeAnalysisModule) => set({ activeAnalysisModule }),
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

  reset: () => set({ ...defaultState }),
}))
