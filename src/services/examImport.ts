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

export interface SubjectFullScoresRequest {
  fullScores: Record<string, number>
}

export async function createExam(data: CreateExamRequest): Promise<CreateExamResponse> {
  return apiClient.post('/exams', data)
}

export async function importScores(examId: string, file: File): Promise<ImportScoresResponse> {
  const formData = new FormData()
  formData.append('file', file)

  // 不手动设置 Content-Type，让 Axios 根据 FormData 自动设置含 boundary 的 multipart/form-data
  return apiClient.post(`/exams/${examId}/scores/import`, formData)
}

export async function updateSubjectFullScores(
  examId: string,
  data: SubjectFullScoresRequest
): Promise<void> {
  return apiClient.put(`/exams/${examId}/subjects/full-scores`, data)
}
