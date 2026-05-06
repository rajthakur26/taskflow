import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.message || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark" style={{ width: 40, height: 40, fontSize: 20, borderRadius: 10 }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>TaskFlow</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Demo credentials</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Register first — the first user becomes Admin automatically.</p>
        </div>
      </div>
    </div>
  )
}
