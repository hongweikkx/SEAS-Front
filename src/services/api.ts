import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
})

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// 请求拦截器：自动附加 Authorization header
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = getCookie('token') || localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const backendMsg =
      error.response?.data?.message
      || error.response?.data?.error
      || error.response?.data?.detail
      || (typeof error.response?.data === 'string' ? error.response.data : null)
    if (backendMsg) {
      error.message = backendMsg
    }
    console.error('API Error:', error.response?.status, error.message, error.response?.data)
    throw error
  }
)

export default apiClient
