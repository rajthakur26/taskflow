import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDate, PROJECT_COLORS } from '../../lib/utils'
import toast from 'react-hot-toast'

const ProjectCard = ({ project, isAdmin, onDelete }) => {
  const stats = project.taskStats || {}
  const total = stats.total || 0
  const done = stats.done || 0
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, transition: 'all 0.2s', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: project.color || '#7c6af5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>◫</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {project.name}
            </h3>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <span className={`badge badge-${project.priority}`}>{project.priority}</span>
          </div>
          {project.description && (
            <p className="text-sm text-muted" style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.description}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{total}</div>
          <div className="text-xs text-muted">Tasks</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>{stats.inProgress || 0}</div>
          <div className="text-xs text-muted">Active</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{done}</div>
          <div className="text-xs text-muted">Done</div>
        </div>
        {stats.overdue > 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{stats.overdue}</div>
            <div className="text-xs text-muted">Overdue</div>
          </div>
        )}
      </div>

      <div className="progress-bar" style={{ marginBottom: 14 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: project.color }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: -6 }}>
          {project.members?.slice(0, 5).map((m, i) => (
            <div key={m.user?._id || i} className="avatar avatar-sm"
              title={m.user?.name}
              style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-2)', zIndex: i }}>
              {m.user?.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.members?.length > 5 && (
            <div className="avatar avatar-sm" style={{ marginLeft: -8, background: 'var(--bg-4)', color: 'var(--text-3)', fontSize: 10 }}>
              +{project.members.length - 5}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(project)}>Delete</button>
          )}
          <Link to={`/projects/${project._id}`} className="btn btn-primary btn-sm">Open →</Link>
        </div>
      </div>

      {project.dueDate && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          Due: {formatDate(project.dueDate)}
        </div>
      )}
    </div>
  )
}

const CreateProjectModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', description: '', color: PROJECT_COLORS[0],
    priority: 'medium', dueDate: '', tags: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Project name is required')
    setLoading(true)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
      delete payload.tagsStr
      const res = await api.post('/projects', payload)
      toast.success('Project created!')
      onSuccess(res.data.data.project)
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) errs.forEach(e => toast.error(e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief project overview…" rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                    cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2, transition: 'transform 0.15s',
                    transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="design, frontend, v2" />
          </div>
          <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none', margin: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data.data.projects),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries(['projects']); toast.success('Project deleted') },
  })

  const handleDelete = (project) => {
    if (confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) {
      deleteMutation.mutate(project._id)
    }
  }

  const projects = data || []
  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin() && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◫</div>
          <div className="empty-title">No projects found</div>
          <div className="empty-desc">{isAdmin() ? 'Create your first project to get started.' : 'You have not been added to any projects yet.'}</div>
          {isAdmin() && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Project</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(p => (
            <ProjectCard key={p._id} project={p} isAdmin={isAdmin()} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries(['projects']) }}
        />
      )}
    </div>
  )
}
