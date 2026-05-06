import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDate, getInitials, getStatusLabel, isOverdue } from '../../lib/utils'
import toast from 'react-hot-toast'

const STATUSES = ['todo', 'in-progress', 'in-review', 'done']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const TaskEditModal = ({ task, projects, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee?._id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    project: task?.project?._id || '',
  })
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadMembers = async (projectId) => {
    if (!projectId) { setMembers([]); return }
    try {
      const res = await api.get(`/projects/${projectId}`)
      setMembers(res.data.data.project.members || [])
    } catch { setMembers([]) }
  }

  const handleProjectChange = (e) => {
    setForm({ ...form, project: e.target.value, assignee: '' })
    loadMembers(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      await api.put(`/tasks/${task._id}`, { ...form, assignee: form.assignee || null })
      toast.success('Task updated!')
      onSaved()
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">Edit Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assignee} onChange={e => setForm({ ...form, assignee: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none', margin: 0 }}>
            <button type="button" className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }}
              onClick={async () => {
                if (confirm('Delete this task?')) {
                  await api.delete(`/tasks/${task._id}`)
                  toast.success('Task deleted')
                  onSaved(); onClose()
                }
              }}>Delete</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { user, isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [editingTask, setEditingTask] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', assignee: '' })

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)
      if (filters.assignee) params.append('assignee', filters.assignee)
      return api.get(`/tasks?${params}`).then(r => r.data.data.tasks)
    },
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => api.get('/projects').then(r => r.data.data.projects),
  })

  const tasks = tasksData || []
  const projects = projectsData || []

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus })
      qc.invalidateQueries(['tasks'])
      toast.success('Status updated')
    } catch { }
  }

  const groupedByProject = tasks.reduce((acc, t) => {
    const key = t.project?._id || 'unknown'
    if (!acc[key]) acc[key] = { project: t.project, tasks: [] }
    acc[key].tasks.push(t)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search tasks…"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }}
          value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 130 }}
          value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ status: '', priority: '', search: '', assignee: '' })}>
            Clear filters ✕
          </button>
        )}
      </div>

      {/* Status summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUSES.map(s => {
          const count = tasks.filter(t => t.status === s).length
          return (
            <button key={s} className={`badge badge-${s}`}
              style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13 }}
              onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s }))}>
              {getStatusLabel(s)}: {count}
            </button>
          )
        })}
        {tasks.filter(t => isOverdue(t.dueDate, t.status)).length > 0 && (
          <span className="badge badge-overdue" style={{ padding: '6px 14px', fontSize: 13 }}>
            ⚠ Overdue: {tasks.filter(t => isOverdue(t.dueDate, t.status)).length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <div className="empty-title">No tasks found</div>
          <div className="empty-desc">Try adjusting your filters or go to a project to create tasks.</div>
          <Link to="/projects" className="btn btn-primary">Go to Projects</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.values(groupedByProject).map(({ project, tasks: ptasks }) => (
            <div key={project?._id || 'unknown'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="color-dot" style={{ background: project?.color || '#7c6af5', width: 12, height: 12 }} />
                <Link to={`/projects/${project?._id}`} style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {project?.name || 'Unknown Project'}
                  </span>
                </Link>
                <span className="text-muted text-sm">({ptasks.length})</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ptasks.map(task => {
                      const overdue = isOverdue(task.dueDate, task.status)
                      return (
                        <tr key={task._id}>
                          <td>
                            <div style={{ fontWeight: 500, maxWidth: 300 }}>{task.title}</div>
                            {task.tags?.length > 0 && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {task.tags.map(tag => (
                                  <span key={tag} style={{
                                    fontSize: 11, padding: '1px 7px', borderRadius: 100,
                                    background: 'var(--bg-4)', color: 'var(--text-3)'
                                  }}>{tag}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            <select className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                              value={task.status}
                              onChange={e => handleStatusChange(task._id, e.target.value)}>
                              {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                            </select>
                          </td>
                          <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                          <td>
                            {task.assignee ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="avatar avatar-sm">{getInitials(task.assignee.name)}</div>
                                <span className="text-sm">{task.assignee.name.split(' ')[0]}</span>
                              </div>
                            ) : <span className="text-muted text-sm">—</span>}
                          </td>
                          <td style={{ fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text-2)', whiteSpace: 'nowrap' }}>
                            {task.dueDate ? (overdue ? '⚠ ' : '') + formatDate(task.dueDate) : '—'}
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => setEditingTask(task)}>Edit</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          projects={projects}
          onClose={() => setEditingTask(null)}
          onSaved={() => { qc.invalidateQueries(['tasks']); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
