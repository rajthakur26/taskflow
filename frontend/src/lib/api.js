import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token')
      localStorage.removeItem('tf_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } else if (err.response?.status !== 422) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export default api
