import { create } from 'zustand'
import type { RatingConfig } from '@/types'

interface AnalysisState {
  selectedExamId: string | null
  selectedExamName: string | null
  selectedSubjectId: string | null
  selectedSubjectName: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  ratingConfig: {
    excellent_threshold: number
    good_threshold: number
    pass_threshold: number
  }
  
  // Actions
  setSelectedExamId: (examId: string) => void
  setSelectedExamName: (examName: string | null) => void
  setSelectedSubjectId: (subjectId: string | null) => void
  setSelectedSubjectName: (subjectName: string | null) => void
  setSelectedScope: (scope: 'all_subjects' | 'single_subject') => void
  setRatingConfig: (config: RatingConfig) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  selectedExamId: null,
  selectedExamName: null,
  selectedSubjectId: null,
  selectedSubjectName: null,
  selectedScope: 'all_subjects',
  ratingConfig: {
    excellent_threshold: 90,
    good_threshold: 70,
    pass_threshold: 60,
  },

  setSelectedExamId: (examId) => set({ selectedExamId: examId }),
  setSelectedExamName: (selectedExamName) => set({ selectedExamName }),
  setSelectedSubjectId: (selectedSubjectId) => set({ selectedSubjectId }),
  setSelectedSubjectName: (selectedSubjectName) => set({ selectedSubjectName }),
  setSelectedScope: (scope) => set({ selectedScope: scope }),
  setRatingConfig: (config) => set({ ratingConfig: config }),
  reset: () =>
    set({
      selectedExamId: null,
      selectedExamName: null,
      selectedSubjectId: null,
      selectedSubjectName: null,
      selectedScope: 'all_subjects',
      ratingConfig: {
        excellent_threshold: 90,
        good_threshold: 70,
        pass_threshold: 60,
      },
    }),
}))
