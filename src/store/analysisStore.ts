import { create } from 'zustand'

interface AnalysisState {
  selectedExamId: string | null
  selectedSubjectId: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  ratingConfig: {
    excellent_threshold: number
    good_threshold: number
    pass_threshold: number
  }
  
  // Actions
  setSelectedExamId: (examId: string) => void
  setSelectedSubjectId: (subjectId: string | null) => void
  setSelectedScope: (scope: 'all_subjects' | 'single_subject') => void
  setRatingConfig: (config: any) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  selectedExamId: null,
  selectedSubjectId: null,
  selectedScope: 'all_subjects',
  ratingConfig: {
    excellent_threshold: 90,
    good_threshold: 70,
    pass_threshold: 60,
  },

  setSelectedExamId: (examId) => set({ selectedExamId: examId }),
  setSelectedSubjectId: (subjectId) => set({ selectedSubjectId: subjectId }),
  setSelectedScope: (scope) => set({ selectedScope: scope }),
  setRatingConfig: (config) => set({ ratingConfig: config }),
  reset: () =>
    set({
      selectedExamId: null,
      selectedSubjectId: null,
      selectedScope: 'all_subjects',
      ratingConfig: {
        excellent_threshold: 90,
        good_threshold: 70,
        pass_threshold: 60,
      },
    }),
}))

