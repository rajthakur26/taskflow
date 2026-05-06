import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'MMM d, yyyy')
}

export const formatDateRelative = (date) => {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatDueDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false
  return isPast(new Date(dueDate))
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const getStatusLabel = (status) => {
  const map = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    'done': 'Done',
  }
  return map[status] || status
}

export const getPriorityIcon = (priority) => {
  const map = { low: '▽', medium: '◈', high: '▲', critical: '⚠' }
  return map[priority] || '◈'
}

export const PROJECT_COLORS = [
  '#7c6af5', '#22d3a0', '#f5c842', '#f55a5a',
  '#4a9eff', '#ff8c42', '#c842f5', '#42f5a7',
  '#f542a7', '#42d4f5',
]

export const truncate = (str, len = 60) =>
  str && str.length > len ? str.slice(0, len) + '…' : str
