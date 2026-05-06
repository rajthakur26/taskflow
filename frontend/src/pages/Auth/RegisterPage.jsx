import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await register(form.name, form.email, form.password)
    if (result.success) {
      toast.success('Account created! Welcome to TaskFlow 🎉')
      navigate('/dashboard')
    } else {
      toast.error(result.message || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark" style={{ width: 40, height: 40, fontSize: 20, borderRadius: 10 }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>TaskFlow</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start managing your team's work</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              type="text" className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="John Doe" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min 6 chars" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm</label>
              <input
                type="password" className={`form-input ${errors.confirm ? 'error' : ''}`}
                placeholder="Repeat password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
              />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
