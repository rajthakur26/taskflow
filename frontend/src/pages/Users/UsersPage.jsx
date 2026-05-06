import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDate, getInitials } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data.users),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('Role updated') },
  })

  const statusMutation = useMutation({
    mutationFn: (id) => api.put(`/users/${id}/status`),
    onSuccess: (_, id) => { qc.invalidateQueries(['users']); toast.success('User status updated') },
  })

  const users = data || []
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const adminCount = users.filter(u => u.role === 'admin').length
  const memberCount = users.filter(u => u.role === 'member').length
  const activeCount = users.filter(u => u.isActive).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage team members and roles</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 24 }}>
        {[
          { val: users.length, label: 'Total Users', icon: '⊕', color: 'rgba(124,106,245,0.2)' },
          { val: activeCount, label: 'Active', icon: '✓', color: 'rgba(34,211,160,0.2)' },
          { val: adminCount, label: 'Admins', icon: '⊛', color: 'rgba(124,106,245,0.2)' },
          { val: memberCount, label: 'Members', icon: '◎', color: 'rgba(74,158,255,0.2)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--glow-color': s.color, padding: 16 }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: 26 }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search users…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 130 }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⊕</div>
          <div className="empty-title">No users found</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm"
                        style={{ background: u.isActive ? 'var(--bg-4)' : 'var(--bg-3)' }}>
                        {u.avatar
                          ? <img src={u.avatar} alt={u.name} onError={e => { e.target.style.display = 'none' }} />
                          : getInitials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        {u._id === currentUser._id && (
                          <span style={{ fontSize: 11, color: 'var(--accent-2)' }}>You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted text-sm">{u.email}</td>
                  <td>
                    {u._id === currentUser._id ? (
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    ) : (
                      <select
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                        value={u.role}
                        onChange={e => roleMutation.mutate({ id: u._id, role: e.target.value })}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-active' : 'badge-archived'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{formatDate(u.createdAt)}</td>
                  <td>
                    {u._id !== currentUser._id && (
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => {
                          if (confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)) {
                            statusMutation.mutate(u._id)
                          }
                        }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
