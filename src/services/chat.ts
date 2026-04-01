import type { ChatRequest, ChatResponse } from '@/types'

function getChatEndpoint() {
  const explicitChatURL = process.env.NEXT_PUBLIC_CHAT_API_URL?.trim()
  if (explicitChatURL) {
    return explicitChatURL
  }

  const apiURL = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (!apiURL) {
    return '/chat'
  }

  try {
    const base = new URL(apiURL)
    return new URL('/chat', `${base.origin}/`).toString()
  } catch {
    if (apiURL.startsWith('/')) {
      return '/chat'
    }
    return `${apiURL.replace(/\/+$/, '')}/chat`
  }
}

export const chatService = {
  sendMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
    const response = await fetch(getChatEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as ChatResponse | { error?: string }
    if (!response.ok) {
      throw new Error('error' in data && data.error ? data.error : '聊天请求失败')
    }

    return data as ChatResponse
  },
}
