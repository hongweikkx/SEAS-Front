import type { RatingConfig } from './analysis'

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export type ChatScope = 'exam_list' | 'all_subjects' | 'single_subject'

export interface ChatContext {
  scope: ChatScope
  examId: string | null
  examName: string | null
  subjectId: string | null
  subjectName: string | null
  ratingConfig?: RatingConfig
}

export interface ChatRequest {
  message: string
  history?: ChatHistoryMessage[]
  context?: ChatContext
}

export type A2UISurfaceID = string

export interface A2UIComponent {
  id: string
  type: 'text' | 'column' | 'row' | 'card' | 'table' | 'chart'
  props?: Record<string, unknown>
  children?: string[]
}

export interface A2UIBeginRendering {
  surfaceId: A2UISurfaceID
  rootComponentId: string
  title?: string
}

export interface A2UISurfaceUpdate {
  surfaceId: A2UISurfaceID
  components: A2UIComponent[]
}

export interface A2UIDataModelUpdate {
  surfaceId: A2UISurfaceID
  data: Record<string, unknown>
}

export interface A2UIInterruptContext {
  id?: string
  name?: string
  address?: string
  type?: string
}

export interface A2UIInterruptRequest {
  surfaceId: A2UISurfaceID
  interruptId?: string
  prompt?: string
  contexts?: A2UIInterruptContext[]
}

export interface A2UIError {
  message: string
}

export interface A2UIMessage {
  beginRendering?: A2UIBeginRendering
  surfaceUpdate?: A2UISurfaceUpdate
  dataModelUpdate?: A2UIDataModelUpdate
  interruptRequest?: A2UIInterruptRequest
  error?: A2UIError
}

export type A2UISurfaceStatus = 'streaming' | 'done' | 'interrupt' | 'error'

export interface A2UISurfaceView {
  surfaceId: string
  rootComponentId: string
  title?: string
  components: Record<string, A2UIComponent>
  data: Record<string, unknown>
  status: A2UISurfaceStatus
  error?: string
  interruptRequest?: A2UIInterruptRequest
}
