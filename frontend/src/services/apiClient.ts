import axios, { type AxiosError } from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Normalise FastAPI error shapes → plain Error so callers only deal with Error.message
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    if (err.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out — the backend took too long to respond.'))
    }
    if (!err.response) {
      return Promise.reject(new Error('Backend is unreachable — make sure the FastAPI server is running on port 8000.'))
    }
    const detail = err.response.data?.detail
    if (Array.isArray(detail)) {
      return Promise.reject(new Error(detail.map((d) => d.msg).join(', ')))
    }
    if (typeof detail === 'string' && detail.length > 0) {
      return Promise.reject(new Error(detail))
    }
    return Promise.reject(new Error(`Server error ${err.response.status} — ${err.response.statusText || 'unknown'}.`))
  },
)

export default apiClient
