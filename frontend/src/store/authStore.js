import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('tf_user') || 'null'),
  token: localStorage.getItem('tf_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { user, token } = res.data.data
      localStorage.setItem('tf_token', token)
      localStorage.setItem('tf_user', JSON.stringify(user))
      set({ user, token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message }
    }
  },

  register: async (name, email, password) => {
    set({ loading: true })
    try {
      const res = await api.post('/auth/register', { name, email, password })
      const { user, token } = res.data.data
      localStorage.setItem('tf_token', token)
      localStorage.setItem('tf_user', JSON.stringify(user))
      set({ user, token, loading: false })
      return { success: true }
    } catch (err) {
      set({ loading: false })
      return { success: false, message: err.response?.data?.message }
    }
  },

  logout: () => {
    localStorage.removeItem('tf_token')
    localStorage.removeItem('tf_user')
    set({ user: null, token: null })
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me')
      const user = res.data.data.user
      localStorage.setItem('tf_user', JSON.stringify(user))
      set({ user })
    } catch {}
  },

  isAdmin: () => get().user?.role === 'admin',
}))

export default useAuthStore
