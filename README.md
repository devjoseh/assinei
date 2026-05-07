# Assinei — Personal Subscription Tracker
> *Suas assinaturas, sob controle.*

A production-quality, private subscription tracker built with Next.js 16 App Router. Track your recurring expenses, get cost breakdowns, and never miss a payment again.

![screenshot placeholder](./public/assinei-banner.png)

## Features

- **Dashboard with stats** — monthly/annual spend, upcoming payments, most expensive subscription
- **Full CRUD** — add, edit, delete, and pause subscriptions
- **Tags** — free-form tagging with autocomplete, filter dashboard by tag
- **Categories** — streaming, SaaS, gaming, education, and more with color-coded badges
- **Payment history** — log actual payments per subscription with notes; delete individual entries
- **Monthly spend chart** — line chart of the last 6 months, collapsible
- **Image history** — reuse logos from previous subscriptions with one click
- **Search & filter** — filter by category (multi-select), tag, and sort by name/price/date
- **Mobile-first** — responsive grid + compact list view toggle
- **Dark/light mode** — grain-textured warm palette
- **Secure** — JWT auth, all secrets server-side only, bcrypt password hashing
- **Payment urgency** — color-coded indicators (red ≤3d, yellow ≤7d, green >7d)
- **Email alerts** — automated email notifications before upcoming payments via Resend

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
- **Charts**: Recharts
- **Email**: Resend transactional email API

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

# Email alerts (optional — see Email Alerts setup below)
RESEND_API_KEY=
CRON_SECRET=
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

## Email Alerts Setup

Email alerts notify you before subscriptions are due. The feature requires a [Resend](https://resend.com/) account and an external cron service.

### 1. Create a Resend account

1. Sign up at [resend.com/](https://resend.com/)
2. Add and verify a sending domain (e.g. `yourdomain.com`)
3. Go to **API Keys** and create a new key
4. Copy the key into your `.env.local`:
   ```env
   RESEND_API_KEY=re_live_xxxxxxxxxxxx
   ```

### 2. Generate a CRON_SECRET

This secret protects the cron endpoint from unauthorized calls.

```bash
openssl rand -hex 32
```

Add the output to `.env.local`:

```env
CRON_SECRET=your-generated-secret-here
```

### 3. Configure alerts in the app

Go to **Settings** (gear icon in the top navbar) → **Alertas por Email**:

| Field | Description |
|---|---|
| Ativar alertas | Master toggle for the feature |
| Enviar alertas | Enable/disable sending without losing your config |
| Dias antes | How many days before due date to alert (1–30) |
| Remetente | Your verified Resend sender — format: `user` + `@domain.com` |
| Nome do remetente | Display name shown in the email From field |
| Destinatários | One or more email addresses to receive the alerts |

Click **Enviar email de teste** to verify everything is working before setting up the cron.

### 4. Set up the cron job (cron-job.org)

Vercel Hobby has a 1-day minimum for cron jobs. Use [cron-job.org](https://cron-job.org) instead for free, daily scheduling.

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job with these settings:

| Setting | Value |
|---|---|
| URL | `https://your-app.vercel.app/api/cron/payment-alerts` |
| Method | `GET` |
| Schedule | `0 9 * * *` (daily at 9:00 AM UTC) |
| Timeout | `30` seconds |
| Request headers | `Authorization: Bearer <your CRON_SECRET>` |

3. Enable the job and run it once manually to confirm it returns `{"sent":true}` or `{"sent":false,"reason":"no upcoming payments"}`.

> **Note**: The cron endpoint returns `401` if the `Authorization` header is missing or incorrect. Check your `CRON_SECRET` value in both Vercel environment variables and cron-job.org if you get authorization errors.

## Deployment (Vercel + MongoDB Atlas)

1. Push this repo to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Add all environment variables in Vercel project settings (omit `AUTH_TRUST_HOST` — it defaults to `true` on Vercel)
4. Deploy — Vercel auto-detects Next.js
5. Set up the cron job on cron-job.org pointing to your production URL (see Email Alerts Setup above)

## Security Notes

- **No secrets reach the client** — MongoDB URI, `AUTH_SECRET`, `RESEND_API_KEY`, and `CRON_SECRET` are server-only. Key lib files use `"server-only"` to prevent accidental client bundling.
- **All API routes validate the session** before any DB operation.
- **Cron endpoint is protected** by a Bearer secret — unauthenticated requests get `401`.
- **Passwords hashed** with bcryptjs (12 rounds).
- **Generic error messages** returned to clients — no stack traces or DB details.
- **Zod validation** on every API endpoint input.

## License

MIT
