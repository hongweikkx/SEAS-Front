export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface ChatTextBlock {
  type: 'text'
  content: string
}

export interface ChatTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

export type ChatTableCell = string | number | boolean | null

export type ChatTableRow = Record<string, ChatTableCell>

export interface ChatTableBlock {
  type: 'table'
  title?: string
  description?: string
  columns: ChatTableColumn[]
  rows: ChatTableRow[]
}

export interface ChatChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  fill?: boolean
}

export interface ChatChartBlock {
  type: 'chart'
  title?: string
  description?: string
  chartType: 'bar' | 'line' | 'pie'
  labels: string[]
  datasets: ChatChartDataset[]
}

export type ChatContentBlock = ChatTextBlock | ChatTableBlock | ChatChartBlock

export interface ChatRequest {
  message: string
  history?: ChatHistoryMessage[]
}

export interface ChatResponse {
  model: string
  answer: string
  blocks?: ChatContentBlock[]
  toolCalls?: ChatToolCall[]
}
