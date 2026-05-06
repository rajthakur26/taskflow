import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDate, getInitials } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuthStore()
  const qc = useQueryClient()

  const [profileForm, setProfileForm] = useState({ name: user?.name || '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return toast.error('Name is required')
    setProfileLoading(true)
    try {
      await api.put('/auth/profile', { name: profileForm.name })
      await refreshUser()
      toast.success('Profile updated!')
    } catch { } finally { setProfileLoading(false) }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!passwordForm.currentPassword) errs.currentPassword = 'Required'
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) errs.newPassword = 'Min 6 characters'
    if (passwordForm.newPassword !== passwordForm.confirm) errs.confirm = 'Passwords do not match'
    setPasswordErrors(errs)
    if (Object.keys(errs).length > 0) return

    setPasswordLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed! Please login again.')
      setTimeout(() => logout(), 1500)
    } catch (err) {
      const msg = err.response?.data?.message
      if (msg?.toLowerCase().includes('current')) {
        setPasswordErrors({ currentPassword: msg })
      }
    } finally { setPasswordLoading(false) }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div className="avatar avatar-xl" style={{ fontSize: 28 }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} onError={e => { e.target.style.display = 'none' }} />
              : getInitials(user?.name)}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{user?.name}</h2>
            <p className="text-muted text-sm">{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              <span className="badge badge-active">Active</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {[
            { label: 'Member Since', val: formatDate(user?.createdAt) },
            { label: 'Account Role', val: user?.role?.toUpperCase() },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-muted" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontWeight: 600, fontSize: 15 }}>{item.val}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>Edit Profile</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profileForm.name}
                onChange={e => setProfileForm({ name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email (read-only)</label>
              <input className="form-input" value={user?.email} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          Change Password
        </h3>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Your current password" />
            {passwordErrors.currentPassword && <span className="form-error">{passwordErrors.currentPassword}</span>}
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min 6 characters" />
              {passwordErrors.newPassword && <span className="form-error">{passwordErrors.newPassword}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className={`form-input ${passwordErrors.confirm ? 'error' : ''}`}
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                placeholder="Repeat new password" />
              {passwordErrors.confirm && <span className="form-error">{passwordErrors.confirm}</span>}
            </div>
          </div>
          <div style={{ padding: 12, background: 'var(--yellow-bg)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: 'var(--radius-sm)' }}>
            <p className="text-sm" style={{ color: 'var(--yellow)' }}>
              ⚠ Changing your password will log you out of all sessions.
            </p>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Updating…</> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ marginTop: 24, borderColor: 'rgba(245,90,90,0.2)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--red)' }}>
          Sign Out
        </h3>
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
          You'll need to log back in to access TaskFlow.
        </p>
        <button className="btn btn-danger" onClick={() => {
          if (confirm('Are you sure you want to logout?')) logout()
        }}>
          Logout
        </button>
      </div>
    </div>
  )
}
