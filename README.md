# AI-Powered Task Management Portal — Frontend

A modern, responsive React + Vite web application built with Tailwind CSS for task creation, management, AI automation, and blockchain verification.

---

## 🌟 Key Features

- 🎨 **Modern & Responsive UI**: Clean interface built with Tailwind CSS for mobile and desktop screens.
- 🔑 **Authentication Flow**: User Registration, Login, and JWT Token state management via LocalStorage.
- 📝 **Full Task CRUD**: Create, Edit, Delete, and Filter tasks by status (`TODO`, `IN_PROGRESS`, `DONE`).
- 🤖 **AI Assistant Modal / Auto-Fill**: One-click AI generation for task description, priority recommendation, and completion time estimates using Google Gemini 1.5.
- ⛓️ **Blockchain Audit Log Modal**: View live cryptographic SHA-256 block chain audit logs and verify tamper-proof status of all task operations.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Deployment**: Vercel (SPA Rewrites enabled)

---

## ⚡ Setup & Local Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AravaChahnaSri/taskmanager-frontend.git
   cd taskmanager-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional, defaults to Render production API):
   Create a `.env` file:
   ```env
   VITE_API_URL=https://taskmanager-backend-49bi.onrender.com
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```
