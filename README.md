# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, project management, kanban boards, and real-time dashboard analytics.

---

## 🚀 Live Demo

- **Frontend:** `https://taskflow-frontend.up.railway.app` *(update after deploy)*
- **Backend API:** `https://taskflow-backend.up.railway.app/api/health`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Zustand, TanStack Query |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Deployment | Railway (separate services) |
| Styling | Custom CSS Design System (no UI lib) |

---

## ✨ Features

### Authentication
- Signup / Login with JWT
- Password hashing with bcrypt (12 salt rounds)
- Protected routes (frontend + backend)
- Auto-logout on token expiry
- Change password from profile

### Role-Based Access Control
- **Admin** — can create/delete projects, manage all users, view all projects/tasks
- **Member** — can only see their assigned projects, create/edit tasks within those projects
- First registered user automatically becomes Admin

### Projects
- Create, edit, delete projects (Admin only)
- Color coding, priority, status, due date, tags
- Task statistics per project (todo/in-progress/in-review/done/overdue)
- Member management (add/remove by email, assign roles)
- Project completion progress bar

### Tasks
- Full CRUD with inline status updates
- Kanban board view (drag-free column grouping)
- List/table view with sortable columns
- Assign to project members, set priority, due date, tags
- Overdue detection with visual warnings
- Quick status change from table view
- Comments on tasks

### Dashboard
- Greeting with time of day
- Stats overview (projects, tasks, completion rate)
- Overall progress bar
- My Tasks panel
- Overdue tasks alert
- Active projects list

### User Management (Admin)
- View all users with stats
- Change user roles (admin ↔ member)
- Activate / deactivate accounts
- Search by name or email

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, error, validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── utils/           # JWT, response helpers
│   │   └── server.js        # App entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── components/      # Shared layout
    │   ├── lib/             # API client, utils
    │   ├── pages/           # Route-level pages
    │   ├── store/           # Zustand auth store
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css        # Design system
    ├── .env.example
    ├── package.json
    └── railway.toml
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier is fine)

### 1. Clone & Setup Backend

```bash
cd taskflow/backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 2. Setup Frontend

```bash
cd taskflow/frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 🌐 Railway Deployment

### Step 1 — MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → free cluster
2. Create user + get connection string
3. Whitelist `0.0.0.0/0` in Network Access

### Step 2 — Deploy Backend on Railway
1. Push `backend/` folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your backend repo
4. Add environment variables:
   ```
   MONGODB_URI=your_atlas_connection_string
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
5. Note your backend URL (e.g. `https://taskflow-backend.up.railway.app`)

### Step 3 — Deploy Frontend on Railway
1. Push `frontend/` folder to a separate GitHub repo
2. New Project → Deploy from GitHub → select frontend repo
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
4. Railway will auto-detect Vite and build it

### Step 4 — Update CORS
After both are deployed, update your backend's `FRONTEND_URL` env variable with the actual frontend Railway URL.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |
| PUT | `/api/auth/profile` | Private |
| PUT | `/api/auth/change-password` | Private |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Private |
| POST | `/api/projects` | Admin |
| GET | `/api/projects/:id` | Private (member) |
| PUT | `/api/projects/:id` | Private (project admin) |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Project Admin |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | Private |
| POST | `/api/tasks` | Private |
| GET | `/api/tasks/dashboard` | Private |
| GET | `/api/tasks/:id` | Private |
| PUT | `/api/tasks/:id` | Private |
| PATCH | `/api/tasks/:id/status` | Private |
| DELETE | `/api/tasks/:id` | Private (creator/admin) |
| POST | `/api/tasks/:id/comments` | Private |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Admin |
| GET | `/api/users/search?email=` | Private |
| PUT | `/api/users/:id/role` | Admin |
| PUT | `/api/users/:id/status` | Admin |

---

## 🔐 Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- Input validation with `express-validator`
- Mongoose schema-level validation
- Protected routes on both frontend and backend
- Role checks at middleware level
- CORS restricted to frontend domain in production

---

## 👤 First Time Setup

1. Register at `/register` — **the first user becomes Admin automatically**
2. As Admin, create a Project from the Projects page
3. Add team members by email from the project's Members tab
4. Create tasks and assign them to members
5. Members can log in and see their assigned projects/tasks

---

## 📝 License

MIT
