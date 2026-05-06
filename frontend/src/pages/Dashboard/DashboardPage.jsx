import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import { formatDueDate, isOverdue, getInitials, getStatusLabel } from '../../lib/utils'

const StatCard = ({ value, label, icon, color }) => (
  <div className="stat-card" style={{ '--glow-color': color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
)

const TaskRow = ({ task }) => {
  const overdue = isOverdue(task.dueDate, task.status)
  return (
    <div className="task-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="task-card-title" style={{ marginBottom: 6 }}>{task.title}</p>
          <div className="task-card-meta">
            {task.project && (
              <Link to={`/projects/${task.project._id}`} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="color-dot" style={{ background: task.project.color }} />
                  <span className="text-xs text-muted">{task.project.name}</span>
                </span>
              </Link>
            )}
            <span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            {task.dueDate && (
              <span className={`text-xs ${overdue ? 'text-danger' : 'text-muted'}`}>
                {overdue ? '⚠ Overdue' : `Due ${formatDueDate(task.dueDate)}`}
              </span>
            )}
          </div>
        </div>
        {task.assignee && (
          <div className="avatar avatar-sm" title={task.assignee.name}>
            {task.assignee.avatar
              ? <img src={task.assignee.avatar} alt={task.assignee.name} />
              : getInitials(task.assignee.name)
            }
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/tasks/dashboard').then(r => r.data.data),
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const { stats, overdueTasks = [], myTasks = [], recentTasks = [], projects = [] } = data || {}

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const completionRate = stats?.totalTasks
    ? Math.round((stats.done / stats.totalTasks) * 100)
    : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard value={stats?.totalProjects || 0} label="Total Projects" icon="◫" color="rgba(124,106,245,0.2)" />
        <StatCard value={stats?.totalTasks || 0} label="Total Tasks" icon="✓" color="rgba(74,158,255,0.2)" />
        <StatCard value={stats?.inProgress || 0} label="In Progress" icon="◐" color="rgba(74,158,255,0.2)" />
        <StatCard value={stats?.done || 0} label="Completed" icon="✅" color="rgba(34,211,160,0.2)" />
        <StatCard value={stats?.overdue || 0} label="Overdue" icon="⚠" color="rgba(245,90,90,0.2)" />
        <StatCard value={`${completionRate}%`} label="Completion Rate" icon="◎" color="rgba(245,200,66,0.2)" />
      </div>

      {/* Progress */}
      {stats?.totalTasks > 0 && (
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Overall Progress</span>
            <span className="text-sm text-muted">{stats.done}/{stats.totalTasks} tasks done</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'To Do', val: stats.todo, cls: 'badge-todo' },
              { label: 'In Progress', val: stats.inProgress, cls: 'badge-in-progress' },
              { label: 'In Review', val: stats.inReview, cls: 'badge-in-review' },
              { label: 'Done', val: stats.done, cls: 'badge-done' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`badge ${s.cls}`}>{s.val}</span>
                <span className="text-xs text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>
                ⚠ Overdue Tasks
              </h2>
              <span className="badge badge-overdue">{overdueTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overdueTasks.map(t => <TaskRow key={t._id} task={t} />)}
            </div>
          </div>
        )}

        {/* My Tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>My Tasks</h2>
            <Link to="/tasks" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {myTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
              No tasks assigned to you
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myTasks.map(t => <TaskRow key={t._id} task={t} />)}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Active Projects</h2>
            <Link to="/projects" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.filter(p => p.status === 'active').slice(0, 5).map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: p.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, opacity: 0.9, flexShrink: 0,
                  }}>◫</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                    <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                      {p.members?.length || 0} members
                    </p>
                  </div>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
              </Link>
            ))}
            {projects.filter(p => p.status === 'active').length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                No active projects
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
