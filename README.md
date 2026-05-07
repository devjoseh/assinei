# Assinei — Personal Subscription Tracker
> *Suas assinaturas, sob controle.*

A production-quality, private subscription tracker built with Next.js 16 App Router. Track your recurring expenses, get cost breakdowns, and never miss a payment again.

![screenshot placeholder](docs/screenshot.png)

## Features

- 📊 **Dashboard with stats** — monthly/annual spend, upcoming payments, most expensive subscription
- 🔄 **Full CRUD** — add, edit, delete, and pause subscriptions
- 🏷️ **Categories** — streaming, SaaS, gaming, education, and more with color-coded badges
- 🖼️ **Image history** — reuse logos from previous subscriptions with one click
- 🔍 **Search & filter** — filter by category (multi-select) and sort by name/price/date
- 📱 **Mobile-first** — responsive grid + compact list view toggle
- 🌙 **Dark/light mode** — grain-textured warm palette
- 🔒 **Secure** — JWT auth, all secrets server-side only, bcrypt password hashing
- 📅 **Payment urgency** — color-coded indicators (red ≤3d, yellow ≤7d, green >7d)

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![NextAuth](https://img.shields.io/badge/NextAuth.js-v5-purple)

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: MongoDB (native driver, no Mongoose)
- **Auth**: NextAuth.js v5 beta — CredentialsProvider + JWT
- **UI**: Tailwind CSS v4 + shadcn/ui (Base UI)
- **Icons**: lucide-react
- **Validation**: Zod v4 (server-side only)
- **Date handling**: date-fns with pt-BR locale
- **Toasts**: Sonner

## Installation

```bash
git clone https://github.com/yourusername/assinei
cd assinei
npm install
```

### Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/assinei?appName=assinei

# NextAuth
AUTH_URL=http://localhost:3000
AUTH_SECRET=your-super-secret-key-min-32-chars
AUTH_TRUST_HOST=true

# Admin credentials (seed script only)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-strong-password
```

### Create the admin user

```bash
npm run seed
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your admin credentials.

## Deployment (Vercel + MongoDB Atlas)

1. Push this repo to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Add the same environment variables in Vercel project settings (omit `AUTH_TRUST_HOST`)
4. Deploy — Vercel auto-detects Next.js

## Security Notes

- **No secrets reach the client** — MongoDB URI, `AUTH_SECRET`, and all credentials are server-only. The `lib/mongodb.ts` and `lib/auth.ts` files use `"server-only"` to prevent accidental client bundling.
- **All API routes validate the session** before any DB operation.
- **Passwords hashed** with bcryptjs (12 rounds).
- **Generic error messages** returned to clients — no stack traces or DB details.
- **Zod validation** on every API endpoint input.

## License

MIT
