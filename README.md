# CateringKita

Platform pemesanan catering online berbasis web.

## 👤 Author
**Ryan** — Project Owner

## 🏗️ Struktur Project

- `backend/` — NestJS API (TypeScript, Prisma, MySQL)
- `frontend/` — Next.js 16 + Tailwind CSS v4 + ShadCN

## 🚀 Cara Menjalankan

### Backend
```bash
cd backend
npm install
# Buat .env dari .env.example dan isi nilainya
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
# Buat .env.local dan isi NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

### Setup Database
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```