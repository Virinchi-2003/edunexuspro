# EduNexus Pro 🎓
**The AI-First, Multi-Tenant SaaS School Management System**

EduNexus Pro is a modern, scalable SaaS platform designed to streamline school operations for multiple stakeholders including Admins, Principals, Staff, Students, and Parents. It features real-time analytics, AI-powered insights, and a professional, responsive UI.

---

## 🚀 Tech Stack

### **Frontend (Web)**
- **React 18** + **TypeScript**
- **Vite 6** (Build Tool)
- **Tailwind CSS v4** (Styling)
- **Shadcn UI v4** (Components)
- **Recharts** (Analytics)
- **Framer Motion** (Animations)

### **Backend**
- **Node.js** + **Express**
- **TypeScript**
- **Firebase Admin SDK** (Authentication & Firestore)
- **Zod** (Schema Validation)

### **Infrastructure**
- **Monorepo Structure**
- **Shared Types** (Consistent data models across Frontend & Backend)

---

## 📂 Project Structure

```text
EduNexusPro/
├── frontend/          # React Web Application
├── backend/           # Node.js Express API
├── shared/            # Common TypeScript Types & Logic
├── mobile_app/        # Flutter Mobile Application Scaffold
└── README.md
```

---

## 🛠️ Getting Started

### **1. Prerequisites**
- Node.js (v18+)
- npm or yarn

### **2. Backend Setup**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   - Replace placeholders with your Firebase Service Account JSON string.
4. Run development server:
   ```bash
   npm run dev
   ```

### **3. Frontend Setup**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Test Credentials (Mock Mode)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@edunexus.pro` | *any* |
| **Principal** | `principal@school.com` | *any* |

---

## ✨ Features
- [x] **AI Insights**: Predictive analytics for school performance.
- [x] **Role-Based Access**: Specialized dashboards for Admin and Principal roles.
- [x] **Schools Management**: Full lifecycle management of partner institutions.
- [x] **Real-time Metrics**: Attendance and fee collection tracking.
- [ ] **Mobile App**: (In Progress) Flutter-based companion apps.

---

## 🌐 Deployment (Render)

### **Backend (Web Service)**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `TURSO_DATABASE_URL`: Your Turso connection string.
  - `TURSO_AUTH_TOKEN`: Your Turso API token.
  - `SMTP_USER` & `SMTP_PASS`: For email notifications.

### **Frontend (Static Site)**
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **SPA Routing (CRITICAL)**:
  - Go to **Redirects/Rewrites** in the Render Dashboard.
  - Add Rule: `/*` -> `/index.html` (Action: **Rewrite**).
- **Environment Variables**:
  - `VITE_API_URL`: Your deployed backend URL + `/api`.

---

## 🛡️ License
Proprietary. All rights reserved.
