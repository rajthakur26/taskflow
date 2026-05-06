import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDate, formatDueDate, getInitials, getStatusLabel, isOverdue, PROJECT_COLORS } from '../../lib/utils'
import toast from 'react-hot-toast'

const STATUSES = ['todo', 'in-progress', 'in-review', 'done']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const TaskCard = ({ task, onEdit, onDelete }) => {
  const overdue = isOverdue(task.dueDate, task.status)
  return (
    <div className="task-card" onClick={() => onEdit(task)}>
      <p className="task-card-title">{task.title}</p>
      <div className="task-card-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`text-xs ${overdue ? 'text-danger' : 'text-muted'}`}>
            {overdue ? '⚠' : '📅'} {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <div className="avatar avatar-sm" title={task.assignee.name} style={{ marginLeft: 'auto' }}>
            {task.assignee.avatar
              ? <img src={task.assignee.avatar} alt={task.assignee.name} />
              : getInitials(task.assignee.name)}
          </div>
        )}
      </div>
    </div>
  )
}

const TaskModal = ({ task, project, onClose, onSaved }) => {
  const isNew = !task
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee?._id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    tags: task?.tags?.join(', ') || '',
  })
  const [loading, setLoading] = useState(false)

  const members = project?.members || []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const payload = {
        ...form,
        project: project._id,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignee: form.assignee || null,
      }
      if (isNew) {
        await api.post('/tasks', payload)
        toast.success('Task created!')
      } else {
        await api.put(`/tasks/${task._id}`, payload)
        toast.success('Task updated!')
      }
      onSaved()
    } catch (err) {
      const errs = err.response?.data?.errors
      if (errs) errs.forEach(e => toast.error(e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? 'New Task' : 'Edit Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add details…" rows={3} />
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
                {members.map(m => (
                  <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="bug, frontend, api" />
          </div>
          <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none', margin: 0 }}>
            {!isNew && (
              <button type="button" className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }}
                onClick={() => { if (confirm('Delete this task?')) { api.delete(`/tasks/${task._id}`).then(() => { toast.success('Task deleted'); onSaved() }); onClose() } }}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AddMemberModal = ({ project, onClose, onSaved }) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await api.post(`/projects/${project._id}/members`, { email, role })
      toast.success('Member added!')
      onSaved()
      onClose()
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none', margin: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const EditProjectModal = ({ project, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: project.name, description: project.description || '',
    color: project.color, status: project.status, priority: project.priority,
    dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/projects/${project._id}`, form)
      toast.success('Project updated!')
      onSaved()
      onClose()
    } catch { } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
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
                    outlineOffset: 2, transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>
          <div className="modal-footer" style={{ paddingTop: 0, borderTop: 'none', margin: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('board')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries(['project', id])

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (error || !data) return <div className="empty-state"><div className="empty-title">Project not found</div><Link to="/projects" className="btn btn-secondary">← Back</Link></div>

  const { project, tasks = [], stats } = data

  const isProjectAdmin = isAdmin() || project.members?.some(
    m => m.user?._id === user?._id && m.role === 'admin'
  )

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s)
    return acc
  }, {})

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus })
      invalidate()
    } catch { }
  }

  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from this project?`)) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      toast.success('Member removed')
      invalidate()
    } catch { }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Link to="/projects" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }}>← Projects</Link>
          <span className="text-muted">/</span>
          <span className="text-sm">{project.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: project.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0
            }}>◫</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>{project.name}</h1>
                <span className={`badge badge-${project.status}`}>{project.status}</span>
                <span className={`badge badge-${project.priority}`}>{project.priority}</span>
              </div>
              {project.description && <p className="text-sm text-muted" style={{ marginTop: 4 }}>{project.description}</p>}
              {project.dueDate && <p className="text-xs text-muted" style={{ marginTop: 4 }}>Due: {formatDate(project.dueDate)}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isProjectAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProject(true)}>Edit Project</button>}
            {isProjectAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>}
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingTask(null); setShowTaskModal(true) }}>+ Add Task</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', marginBottom: 24 }}>
        {[
          { val: stats?.total || 0, label: 'Total', color: 'rgba(124,106,245,0.2)', icon: '✓' },
          { val: stats?.inProgress || 0, label: 'In Progress', color: 'rgba(74,158,255,0.2)', icon: '◐' },
          { val: stats?.inReview || 0, label: 'In Review', color: 'rgba(245,200,66,0.2)', icon: '◑' },
          { val: stats?.done || 0, label: 'Done', color: 'rgba(34,211,160,0.2)', icon: '✅' },
          { val: stats?.overdue || 0, label: 'Overdue', color: 'rgba(245,90,90,0.2)', icon: '⚠' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ '--glow-color': s.color, padding: 14 }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>{s.icon}</div>
            <div className="stat-value" style={{ fontSize: 24 }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'board', label: 'Kanban Board' },
          { key: 'list', label: 'List View' },
          { key: 'members', label: `Members (${project.members?.length || 0})` },
        ].map(t => (
          <button key={t.key} className="btn btn-ghost btn-sm"
            onClick={() => setActiveTab(t.key)}
            style={{
              borderRadius: '6px 6px 0 0', borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === t.key ? 'var(--accent-2)' : 'var(--text-2)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">{getStatusLabel(status)}</span>
                <span className="kanban-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="kanban-tasks">
                {tasksByStatus[status].map(task => (
                  <TaskCard key={task._id} task={task}
                    onEdit={(t) => { setEditingTask(t); setShowTaskModal(true) }}
                    onDelete={() => { }}
                  />
                ))}
                <button className="btn btn-ghost btn-sm btn-full"
                  style={{ marginTop: 4, color: 'var(--text-3)', justifyContent: 'flex-start' }}
                  onClick={() => { setEditingTask({ status }); setShowTaskModal(true) }}>
                  + Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <div className="empty-title">No tasks yet</div>
              <div className="empty-desc">Add your first task to get started</div>
              <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskModal(true) }}>+ Add Task</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => {
                    const overdue = isOverdue(task.dueDate, task.status)
                    return (
                      <tr key={task._id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{task.title}</div>
                          {task.description && <div className="text-xs text-muted">{task.description.slice(0, 60)}…</div>}
                        </td>
                        <td>
                          <select className="form-input" style={{ padding: '4px 8px', fontSize: 13, width: 'auto' }}
                            value={task.status}
                            onChange={e => handleStatusChange(task._id, e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                          </select>
                        </td>
                        <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                        <td>
                          {task.assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="avatar avatar-sm">{getInitials(task.assignee.name)}</div>
                              <span className="text-sm">{task.assignee.name}</span>
                            </div>
                          ) : <span className="text-muted text-sm">—</span>}
                        </td>
                        <td className={overdue ? 'text-danger' : 'text-muted'} style={{ fontSize: 13 }}>
                          {task.dueDate ? (overdue ? '⚠ ' : '') + formatDate(task.dueDate) : '—'}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingTask(task); setShowTaskModal(true) }}>Edit</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {isProjectAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {project.members?.map(member => (
                  <tr key={member.user?._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{getInitials(member.user?.name)}</div>
                        <span style={{ fontWeight: 500 }}>{member.user?.name}</span>
                        {member.user?._id === user?._id && <span className="badge badge-member" style={{ fontSize: 10 }}>You</span>}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{member.user?.email}</td>
                    <td><span className={`badge badge-${member.role}`}>{member.role}</span></td>
                    <td className="text-muted text-sm">{formatDate(member.joinedAt)}</td>
                    {isProjectAdmin && (
                      <td>
                        {member.user?._id !== project.owner?._id && member.user?._id !== user?._id && (
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.user?._id, member.user?.name)}>
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editingTask?._id ? editingTask : null}
          project={project}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          onSaved={() => { invalidate(); setShowTaskModal(false); setEditingTask(null) }}
        />
      )}
      {showAddMember && (
        <AddMemberModal project={project} onClose={() => setShowAddMember(false)} onSaved={invalidate} />
      )}
      {showEditProject && (
        <EditProjectModal project={project} onClose={() => setShowEditProject(false)} onSaved={invalidate} />
      )}
    </div>
  )
}
