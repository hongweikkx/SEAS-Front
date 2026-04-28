import apiClient from './api'

export interface CreateExamRequest {
  name: string
  examDate: string
}

export interface CreateExamResponse {
  examId: string
  name: string
  examDate: string
}

export interface ImportScoresResponse {
  examId: string
  importedStudents: number
  importedSubjects: number
  mode: 'simple' | 'full'
  warnings: string[]
}

export async function createExam(data: CreateExamRequest): Promise<CreateExamResponse> {
  return apiClient.post('/exams', data)
}

export async function importScores(examId: string, file: File): Promise<ImportScoresResponse> {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient.post(`/exams/${examId}/scores/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
