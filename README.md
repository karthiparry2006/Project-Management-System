# PMS Core - AI-Powered Project Management System

An intelligent, full-stack Project Management System featuring an interactive Kanban workspace, role-based access control, analytics dashboard, and an integrated **AI RAG Assistant** that can understand context, answer questions about project states, and create tasks from natural language.

---

## 🌟 Key Features

- **Interactive Kanban Board**: Visual workflow management with smooth status progression (`Backlog` ➔ `In Progress` ➔ `In Review` ➔ `Done`).
- **AI RAG Assistant**:
  - Contextual Retrieval-Augmented Generation over projects, tasks, and team comments.
  - Natural language task creation (e.g., *"Create an urgent task to fix auth bug for dev1 due tomorrow"*).
  - Semantic vector search with sentence embeddings (`SentenceTransformer` / high-speed fallback).
- **Executive Analytics Dashboard**:
  - Real-time project metrics (Total Tasks, Overdue alerts, Completion rate, Priority distributions).
  - Multi-project switching and team assignment filters.
- **Enterprise-Grade Authentication**:
  - Role-Based Access Control (`Admin`, `Project Manager`, `Developer`).
  - Secure JSON Web Token (`JWT`) authentication with automatic refresh headers.
- **RESTful Architecture**: Clean, decoupled API endpoints powered by Django REST Framework.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: Axios with JWT interceptors
- **Markdown Rendering**: React-Markdown for assistant responses

### Backend
- **Framework**: [Django](https://www.djangoproject.com/) + [Django REST Framework](https://www.django-rest-framework.org/)
- **Auth**: SimpleJWT (Bearer Token authentication)
- **Database**: MySQL 8.x (with configurable environment parameters)
- **Vector Search / RAG**: Vector store with cosine similarity & `SentenceTransformer('all-MiniLM-L6-v2')`
- **CORS**: `django-cors-headers`

---

## 📁 Project Structure

```text
pmd/
├── backend/
│   ├── accounts/              # User models, authentication & role management
│   ├── assistant/             # RAG Engine, vector store & AI assistant API
│   ├── config/                # Django project settings, URLs, WSGI/ASGI
│   ├── projects/              # Projects data models, views, and metrics API
│   ├── tasks/                 # Tasks, Kanban status mutations, comments
│   ├── vector_store_data/     # Local vector embeddings & index metadata
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   ├── seed_data.py           # Database seeder & vector re-indexing
│   └── .env.example           # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios API client & endpoints
│   │   ├── components/        # Kanban board, AI Chat drawer, Dashboard widgets
│   │   ├── context/           # Auth and Project state providers
│   │   ├── pages/             # Login & Dashboard main views
│   │   ├── App.jsx            # Main app router & layout
│   │   └── index.css          # Design system & Tailwind imports
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
├── e2e_test.py                # End-to-end integration verification suite
├── .gitignore                 # Root Git ignore rules
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.10+ (Tested on 3.11 - 3.14)
- **Node.js**: 18+ & npm
- **MySQL**: 8.x running locally (or configured remote instance)

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment** *(recommended)*:
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (you can copy `.env.example`):
   ```env
   SECRET_KEY=your-secure-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=*

   # MySQL Settings
   DB_NAME=pms_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   DB_PORT=3306
   ```

5. **Apply Database Migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Seed Initial Demo Data & Vector Store**:
   ```bash
   python seed_data.py
   ```
   *This seeds sample users (`admin`, `manager`, `dev1`, `dev2`), projects, tasks, and pre-indexes embeddings.*

7. **Start the Django Development Server**:
   ```bash
   python manage.py runserver 8080
   ```

---

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node modules**:
   ```bash
   npm install
   ```

3. **Run the Vite Dev Server**:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.

---

## 🔑 Default Credentials

All pre-seeded demo accounts share the password: `password123`

| Username | Role | Permissions |
| :--- | :--- | :--- |
| `admin` | Admin | Full system administration, project and user control |
| `manager` | Project Manager | Project creation, task assignment, metrics analysis |
| `dev1` | Developer | Task status progression, comments, code tracking |
| `dev2` | Developer | Task status progression, comments |

---

## 🧪 Running Automated Tests

Run the complete end-to-end verification suite:

```bash
python e2e_test.py
```

The test suite validates:
- Frontend dev server availability
- User authentication & JWT issuance
- Projects and real-time metrics calculation
- Kanban board task lane mutations (`PATCH /api/tasks/{id}/`)
- AI RAG query processing and natural language task generation

---

## 📄 License

This project is licensed under the MIT License.
