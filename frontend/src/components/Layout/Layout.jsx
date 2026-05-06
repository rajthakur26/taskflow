import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getInitials } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/projects', icon: '◫', label: 'Projects' },
  { to: '/tasks', icon: '✓', label: 'My Tasks' },
]

const adminNavItems = [
  { to: '/users', icon: '⊕', label: 'Users' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">⚡</div>
          <span className="logo-text">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin() && (
            <>
              <div className="nav-section-label" style={{ marginTop: 12 }}>Admin</div>
              {adminNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className="user-card"
            style={{ textDecoration: 'none' }}
            onClick={() => setSidebarOpen(false)}
          >
            <div className="avatar">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} onError={e => { e.target.style.display = 'none' }} />
                : getInitials(user?.name)
              }
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </NavLink>
          <button
            className="btn btn-ghost btn-full btn-sm"
            style={{ marginTop: 8, justifyContent: 'flex-start', gap: 8 }}
            onClick={handleLogout}
          >
            <span>↩</span> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        {/* Mobile header */}
        <div style={{
          display: 'none',
          padding: '12px 16px',
          background: 'var(--bg-2)',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }} className="mobile-header">
          <div className="sidebar-logo" style={{ padding: 0, border: 'none' }}>
            <div className="logo-mark" style={{ width: 28, height: 28, fontSize: 13 }}>⚡</div>
            <span className="logo-text" style={{ fontSize: 16 }}>TaskFlow</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>☰</button>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
