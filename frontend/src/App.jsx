import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ProjectsPage from './pages/Projects/ProjectsPage'
import ProjectDetailPage from './pages/Projects/ProjectDetailPage'
import TasksPage from './pages/Tasks/TasksPage'
import UsersPage from './pages/Users/UsersPage'
import ProfilePage from './pages/Profile/ProfilePage'

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { token, isAdmin } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin()) return <Navigate to="/dashboard" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
