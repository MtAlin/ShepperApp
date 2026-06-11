# ShepperApp — Shepherd Planner

A full-stack church planning application built with React/Vite (frontend) and Node.js/Express (backend).

## Project Structure

```
ShepperApp/
├── shepherd-planner-ui/       # React + Vite + TailwindCSS frontend
└── shepherd-planner-backend/  # Node.js + Express + MongoDB backend
```

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- React Router v6
- React Query
- Axios

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT Authentication
- Cloudinary (media uploads)
- Stripe (payments)

## Getting Started

### Backend

```bash
cd shepherd-planner-backend
cp .env.example .env          # fill in your real values
npm install
node index.js
```

### Frontend

```bash
cd shepherd-planner-ui
cp .env.example .env.local    # fill in VITE_API_URL
npm install
npm run dev
```

## Deployment

- **Frontend** → Vercel (auto-detected as Vite project)
- **Backend** → Vercel (configured via `vercel.json`)

Set `VITE_API_URL` in your Vercel frontend project environment variables to point to your deployed backend URL.
