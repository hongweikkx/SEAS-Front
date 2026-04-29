import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
})

// 响应拦截器
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    // 提取后端返回的具体错误信息，方便前端显示
    const backendMsg = error.response?.data?.message
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

