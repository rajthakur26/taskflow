# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project management, kanban boards, and real-time dashboard analytics.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://taskflow-pro.up.railway.app |
| **Backend API** | https://taskflow-production-b105.up.railway.app |
| **Health Check** | https://taskflow-production-b105.up.railway.app/api/health |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Zustand, TanStack Query |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (NoSQL) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Railway (2 separate services) |
| Styling | Custom CSS Design System (no UI library) |

---

## ✨ Features

### 🔐 Authentication
- Signup / Login with JWT tokens
- Password hashing with bcrypt (12 salt rounds)
- Protected routes on both frontend and backend
- Auto-logout on token expiry
- Change password from profile page
- First registered user automatically becomes **Admin**

### 👥 Role-Based Access Control (RBAC)
| Feature | Admin | Member |
|---------|-------|--------|
| Create/Delete Projects | ✅ | ❌ |
| View all projects | ✅ | ❌ |
| View assigned projects | ✅ | ✅ |
| Add/Remove members | ✅ | ❌ |
| Create/Edit Tasks | ✅ | ✅ |
| Manage Users | ✅ | ❌ |
| Dashboard | ✅ | ✅ |

### 📁 Projects
- Create, edit, delete projects (Admin only)
- Color coding, priority levels, status, due dates, tags
- Task statistics per project (todo/in-progress/in-review/done/overdue)
- Member management — add by email, assign project-level roles
- Progress bar showing completion percentage

### ✅ Tasks
- Full CRUD operations
- **Kanban board** view with 4 columns (To Do / In Progress / In Review / Done)
- **List/table** view with inline status updates
- Assign tasks to project members
- Set priority (low/medium/high/critical), due date, tags
- Overdue detection with visual warnings
- Comments on tasks
- Quick status change from table view

### 📊 Dashboard
- Personalized greeting based on time of day
- Stats overview — projects, tasks, completion rate
- Overall progress bar
- My Tasks panel
- Overdue tasks alert panel
- Active projects list

### 👤 User Management (Admin only)
- View all users with stats
- Change user roles (admin ↔ member)
- Activate / deactivate accounts
- Search users by name or email

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      # JWT verify + role checks
│   │   │   ├── error.middleware.js     # Global error handler
│   │   │   └── validate.middleware.js  # express-validator
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── project.model.js
│   │   │   └── task.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── user.routes.js
│   │   ├── utils/
│   │   │   ├── jwt.utils.js
│   │   │   └── response.utils.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── public/
    │   └── _redirects              # SPA routing fix
    ├── src/
    │   ├── components/
    │   │   └── Layout/Layout.jsx   # Sidebar + navigation
    │   ├── lib/
    │   │   ├── api.js              # Axios instance + interceptors
    │   │   └── utils.js            # Date helpers, constants
    │   ├── pages/
    │   │   ├── Auth/               # Login + Register
    │   │   ├── Dashboard/          # Overview + stats
    │   │   ├── Projects/           # List + Detail + Kanban
    │   │   ├── Tasks/              # All tasks with filters
    │   │   ├── Users/              # Admin user management
    │   │   └── Profile/            # Edit profile + password
    │   ├── store/
    │   │   └── authStore.js        # Zustand auth state
    │   ├── App.jsx                 # Routes + guards
    │   ├── main.jsx
    │   └── index.css               # Full design system
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── railway.toml
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/rajthakur26/taskflow.git
cd taskflow
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
# Runs on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
# Runs on http://localhost:5173
```

---

## 🌐 Deployment (Railway)

Both services deployed on **Railway** from a single GitHub repository using Root Directory configuration.

| Service | Root Directory | URL |
|---------|---------------|-----|
| Backend | `backend/` | https://taskflow-production-b105.up.railway.app |
| Frontend | `frontend/` | https://taskflow-pro.up.railway.app |

### Backend Environment Variables
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://taskflow-pro.up.railway.app
PORT=5000
```

### Frontend Environment Variables
```env
VITE_API_URL=https://taskflow-production-b105.up.railway.app/api
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | Get all accessible projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Private | Get project + tasks |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | Project Admin | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |
| PUT | `/api/projects/:id/members/:userId` | Project Admin | Update member role |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | Get tasks with filters |
| POST | `/api/tasks` | Private | Create task |
| GET | `/api/tasks/dashboard` | Private | Dashboard stats |
| GET | `/api/tasks/:id` | Private | Get single task |
| PUT | `/api/tasks/:id` | Private | Update task |
| PATCH | `/api/tasks/:id/status` | Private | Quick status update |
| DELETE | `/api/tasks/:id` | Private | Delete task |
| POST | `/api/tasks/:id/comments` | Private | Add comment |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/search?email=` | Private | Search users |
| PUT | `/api/users/:id/role` | Admin | Update user role |
| PUT | `/api/users/:id/status` | Admin | Toggle active status |

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens with 7-day expiry
- Input validation with **express-validator** on all endpoints
- Mongoose schema-level validation
- **CORS** restricted to frontend domain in production
- Role-based middleware on every protected route
- Global error handler — no stack traces in production

---

## 👤 First Time Usage

1. Go to https://taskflow-pro.up.railway.app/register
2. Register — **first user becomes Admin automatically**
3. As Admin → create a Project from Projects page
4. Add team members by their email from the Members tab
5. Create tasks and assign them to members
6. Members log in and see their assigned projects and tasks

---

## 📦 Submission

- **Live URL:** https://taskflow-pro.up.railway.app
- **GitHub Repo:** https://github.com/rajthakur26/taskflow
- **Backend API:** https://taskflow-production-b105.up.railway.app/api/health

---

## 📝 License

MIT