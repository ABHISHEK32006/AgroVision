# 🌾 Agrovision v2 — Smart Farming Management System

Full-stack dual-portal system with **PostgreSQL auth**, **farmer self-management**, and **smart reminders**.

---

## 📁 Project Structure

```
Agrovision_v2/
│
├── index.html
├── package.json              ← React (Vite) dependencies
├── vite.config.js            ← proxies /api → backend:4000
│
├── src/
│   ├── main.jsx
│   ├── App.jsx               ← root: Login → Admin or Farmer portal
│   ├── index.css
│   ├── api.js                ← all fetch calls to Express backend
│   └── components/
│       ├── Login.jsx         ← DB-backed login with role cards
│       ├── Shared.jsx        ← reusable UI components
│       ├── AdminPortal.jsx   ← admin dashboard + farmer creation
│       └── FarmerPortal.jsx  ← farmer self-management + reminders
│
├── backend/
│   ├── server.js             ← Express + pg + bcrypt
│   ├── package.json
│   └── .env.example
│
└── database/
    └── schema.sql            ← full schema + functions + triggers + seed data
```

---

## 🚀 Setup & Run

### Step 1 — Database
```bash
psql -U postgres -c "CREATE DATABASE smart_farming;"
psql -U postgres -d smart_farming -f database/schema.sql
```

### Step 2 — Backend
```bash
cd backend
npm install
cp .env.example .env        # fill in DB_PASSWORD
node server.js
# 🌾 Agrovision backend running on http://localhost:4000
```

### Step 3 — Frontend
```bash
# from project root
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🔐 Login Credentials (from seed data)

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | admin    | admin123   |
| Farmer | ramesh   | admin123   |
| Farmer | suresh   | admin123   |
| Farmer | mahesh   | admin123   |
| Farmer | dinesh   | admin123   |

> To generate a new bcrypt hash for any password:
> ```bash
> node -e "require('bcrypt').hash('yourpass',10).then(console.log)"
> ```

---

## ✨ What's New in v2

### Login
- Role-selector cards (Admin / Farmer)
- Credentials validated against `users` table in PostgreSQL
- Error messages shown on invalid login
- No hardcoded passwords or dropdowns

### Admin Portal
- **Add Farmer** creates both a `farmers` record + `users` login in one transaction
- Sets username + password (bcrypt hashed) at creation time
- Full overview: farmers, farms, crops, equipment, resources, sensors, irrigation
- Reminder badges on sidebar for overdue items

### Farmer Portal
- **Add Farm** — farmer registers their own farm
- **Add Equipment** — farmer tracks their own equipment
- **Add Fertilizer** — with quantity, type, last applied date, and frequency
- **Add Pesticide** — same tracking
- **Add Irrigation** — type, water source, frequency in days
- **Record Application** — when farmer applies fertilizer/pesticide, updates `last_applied` and resets `next_due`
- **Mark Irrigation Done** — records timestamp, auto-calculates next due
- **Reminders** — dashboard shows overdue items with days overdue
- Sidebar badges show count of overdue items per section

### Reminders & Alerts
- `next_due` is a **generated column** in DB: `last_applied + frequency_days`
- `fn_check_reminders(farm_id)` PostgreSQL function returns all overdue items
- Frontend calls `/api/reminders?farmer_id=X` to get actionable list
- Irrigation overdue calculated in real-time from `last_irrigated + frequency_days`
- Sensor threshold alerts auto-created by DB trigger on INSERT

---

## 🗄️ Key API Endpoints

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| POST   | /api/auth/login                   | Login with username + password     |
| GET    | /api/farmers                      | List all farmers (admin)           |
| POST   | /api/farmers                      | Add farmer + create user account   |
| GET    | /api/farms?farmer_id=X            | Farms for a farmer                 |
| POST   | /api/farms                        | Add farm                           |
| POST   | /api/equipment                    | Add equipment                      |
| POST   | /api/fertilizers                  | Add fertilizer                     |
| PATCH  | /api/fertilizers/:id/apply        | Record application (updates dates) |
| POST   | /api/pesticides                   | Add pesticide                      |
| PATCH  | /api/pesticides/:id/apply         | Record application                 |
| POST   | /api/irrigation                   | Add irrigation system              |
| PATCH  | /api/irrigation/:id/irrigate      | Mark irrigation as done            |
| GET    | /api/reminders?farmer_id=X        | All overdue reminders              |
| GET    | /api/alerts?farmer_id=X           | Unresolved alerts                  |
| PATCH  | /api/alerts/:id/resolve           | Mark alert resolved                |

---

## 🔔 How Reminders Work

1. Every fertilizer/pesticide has `last_applied` + `frequency_days`
2. DB computes `next_due = last_applied + frequency_days` automatically (generated column)
3. When farmer records an application → `last_applied` updates → `next_due` recalculates
4. `/api/reminders` calls `fn_check_reminders()` which queries all overdue items
5. Frontend shows them on dashboard + sidebar badges + section warnings
6. Same logic for irrigation using `last_irrigated` timestamp
Project maintained by Team AgroVision