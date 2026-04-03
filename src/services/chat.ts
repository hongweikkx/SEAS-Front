import type { ChatRequest } from '@/types'

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
  streamMessage: async (payload: ChatRequest) => {
    const response = await fetch(getChatEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? '聊天请求失败')
    }

    return response
  },
}
