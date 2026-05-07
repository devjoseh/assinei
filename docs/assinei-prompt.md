# Assinei — Personal Subscription Tracker

## Project Overview

Build a full-stack **Next.js 15 (App Router)** web application called **Assinei** — a personal subscription tracker. The app is private (single admin user), but will be open-source on GitHub and should reflect production-quality code and design.

The site must be fully in **Brazilian Portuguese**. All environment variables and credentials must live **exclusively on the server** (API Routes / Server Components). The frontend must never have direct access to MongoDB, secrets, or credentials. All data operations go through internal Next.js API routes.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: MongoDB (via `mongodb` native driver — no Mongoose)
- **Auth**: NextAuth.js v5 (beta) with `CredentialsProvider` — JWT strategy, server-side only
- **Styling**: Tailwind CSS + shadcn/ui components
- **Theme**: `next-themes` for light/dark mode toggle
- **Icons**: `lucide-react`
- **Validation**: `zod` (server-side on API routes)
- **Date handling**: `date-fns` with `pt-BR` locale
- **Image preview**: native `<img>` tag with error fallback
- **Deployment-ready**: `.env.local` with all secrets

---

## Security Requirements

- All MongoDB operations happen exclusively in `/app/api/**` route handlers and Server Components that feed into API calls
- No MongoDB URI, credentials, or secrets must be accessible or bundled into client-side code
- NextAuth session validation must be checked on every protected API route using `auth()` from NextAuth
- Passwords stored hashed with `bcryptjs`
- All API routes return generic error messages (no stack traces or DB details)
- Input sanitization and Zod validation on every API endpoint

---

## Authentication

Single-user system. No public registration. The admin account is created via a **setup script** (`scripts/seed-admin.ts`) that reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from env and inserts the hashed user into MongoDB.

- `/` → Login page (if not authenticated) OR redirect to `/dashboard`
- NextAuth handles session via JWT (stored in HTTP-only cookies)
- Login page: minimal, centered card, email + password fields
- No "forgot password", no registration link — this is a private tool
- After login: redirect to `/dashboard`

---

## Database Schema (MongoDB collections)

### `users`
```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  createdAt: Date
}
```

### `subscriptions`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,           // e.g. "Netflix"
  description?: string,
  price: number,          // always in BRL cents (integer)
  billingCycle: "weekly" | "monthly" | "quarterly" | "semiannual" | "annual",
  nextPaymentDate: Date,
  category: string,       // e.g. "Streaming", "SaaS", "Jogos", "Educação", "Outros"
  imageUrl?: string,
  color?: string,         // hex color for fallback avatar
  isActive: boolean,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### `image_history`
```ts
{
  _id: ObjectId,
  userId: ObjectId,
  url: string,
  label?: string,         // inferred from subscription name when first used
  usageCount: number,
  lastUsedAt: Date,
  createdAt: Date
}
```

---

## API Routes

All routes under `/app/api/` — every route must validate the session with `auth()` before proceeding.

```
POST   /api/auth/[...nextauth]    → NextAuth handler
GET    /api/subscriptions         → List all subscriptions (with optional ?category= and ?sort=)
POST   /api/subscriptions         → Create subscription
GET    /api/subscriptions/[id]    → Get single subscription
PATCH  /api/subscriptions/[id]    → Update subscription
DELETE /api/subscriptions/[id]    → Delete subscription
GET    /api/stats                 → Aggregated stats (total monthly, annual, next payments, etc.)
GET    /api/image-history         → List saved image URLs (sorted by usageCount desc)
POST   /api/image-history         → Upsert an image URL into history
DELETE /api/image-history/[id]    → Remove from history
```

---

## Pages & Layout

### `/` — Login Page
- Full-screen centered layout
- App logo/name "Assinei" at top with tagline: *"Suas assinaturas, sob controle."*
- Email + password fields
- Submit button
- Subtle grain texture overlay on background
- Light/dark mode toggle in corner
- No register link, no forgot password

### `/dashboard` — Main Dashboard (protected)
- Top navbar: logo, greeting (e.g., "Bom dia, Admin"), dark/light toggle, logout button
- **Stats bar** (horizontal scroll on mobile, grid on desktop):
  - 💸 Gasto mensal total
  - 📅 Próximo pagamento (name + days remaining)
  - 📆 Estimativa anual
  - 📊 Estimativa semestral
  - 🏆 Assinatura mais cara
  - 🔢 Total de assinaturas ativas
- **Subscription grid** (2 cols on mobile, 3-4 on desktop)
- Search bar + category filter pills + sort dropdown (por preço, por nome, por próximo pagamento)
- FAB (Floating Action Button) — "+" to add subscription
- Empty state illustration when no subscriptions

### Subscription Card
- Logo/image (with fallback to colored initial avatar using `color` field)
- Name
- Price formatted as `R$ XX,XX / mês` (normalized to monthly equivalent)
- Billing cycle badge
- Next payment date with colored urgency indicator:
  - 🔴 ≤ 3 dias
  - 🟡 ≤ 7 dias
  - 🟢 > 7 dias
- Category chip
- Edit + Delete action buttons (visible on hover / always visible on mobile)

### Add/Edit Subscription Modal (Sheet or Dialog)
- Fields: Nome*, Preço* (in R$), Ciclo de cobrança*, Próximo pagamento*, Categoria, URL da imagem, Cor (color picker for avatar fallback), Notas
- Image URL field: real-time preview below the input
- Image history dropdown: when the user focuses the image URL field, show a grid of previously used image URLs (from `image_history`) that can be clicked to fill the field — show thumbnail + label
- Zod validation feedback inline
- Save / Cancel buttons

### Delete Confirmation
- AlertDialog component
- Shows subscription name in the warning text

---

## Stats Logic (server-side in `/api/stats`)

Normalize all prices to monthly equivalent:
- weekly × 4.33
- monthly × 1
- quarterly ÷ 3
- semiannual ÷ 6
- annual ÷ 12

Return:
```ts
{
  totalMonthly: number,
  totalAnnual: number,
  totalSemiannual: number,
  mostExpensive: { name, price, billingCycle },
  nextPayment: { name, date, daysUntil },
  upcomingPayments: Array<{ name, date, daysUntil, price }>, // next 30 days
  totalActive: number,
  categoryBreakdown: Array<{ category, total, count }>
}
```

---

## Design System

### Visual Style
- Inspired by: modern SaaS + editorial feel + slight retro warmth
- **Grain texture overlay**: subtle SVG-based or CSS `filter` noise over backgrounds (4–8% opacity)
- Fonts: `Geist` (Next.js default) or `Inter` — clean, modern
- Rounded corners everywhere (`rounded-xl`, `rounded-2xl`)
- Cards with slight border + shadow (`border border-border shadow-sm`)
- Generous whitespace

### Color Palette

**Light mode:**
- Background: `#F5F4F0` (warm off-white, not pure white)
- Card: `#FFFFFF`
- Text: `#1A1A2E`
- Accent: `#E8770A` (warm orange)
- Border: `#E2E0DA`

**Dark mode:**
- Background: `#111110`
- Card: `#1C1C1A`
- Text: `#F0EEE8`
- Accent: `#E8770A` (same orange)
- Border: `#2A2A28`

### shadcn/ui components to use
- `Card`, `Button`, `Input`, `Label`, `Badge`, `Dialog`/`Sheet`, `Select`, `AlertDialog`, `Popover`, `ScrollArea`, `Skeleton` (for loading states), `Separator`, `Tooltip`

### Grain Texture Implementation
Add a global pseudo-element overlay in `globals.css`:
```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
}
```

---

## UX Details

- **Loading states**: use `Skeleton` components while fetching — never show blank/flash
- **Optimistic updates**: on delete/edit, update UI immediately, revert on error
- **Toast notifications**: use `sonner` for success/error feedback (e.g., "Assinatura criada!", "Erro ao salvar")
- **Keyboard accessible**: all modals closeable with Esc, forms submittable with Enter
- **Mobile-first**: bottom sheet instead of dialog on mobile for add/edit form (use `vaul` drawer or shadcn Sheet)
- **Image error handling**: if `imageUrl` is broken/fails to load, fallback to colored initial avatar instantly
- **Date formatting**: all dates in `pt-BR` format (e.g., "15 de jun. de 2025")
- **Currency formatting**: always `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Empty states**: friendly illustrated empty state for no subscriptions, no search results

---

## Additional Features

1. **Upcoming Payments Panel**: collapsible section or separate tab showing all payments in the next 30 days, sorted by date
2. **Category filter pills**: click to filter by category, multi-select supported
3. **Sort options**: por nome (A–Z), por preço (maior/menor), por próximo pagamento
4. **Active/Inactive toggle per subscription**: paused subscriptions still visible but greyed out, excluded from totals
5. **Image history management**: a settings page at `/configuracoes` where the admin can see and delete saved image URLs
6. **Responsive table view toggle**: grid view (default) ↔ compact list view (toggle button in dashboard header)
7. **Copy to clipboard** on subscription card: copy price + name for quick reference
8. **Color-coded category badges**: each category has a consistent color (defined in a `CATEGORY_COLORS` constant)

---

## File Structure

```
assinei/
├── app/
│   ├── (auth)/
│   │   └── page.tsx               # Login page
│   ├── (protected)/
│   │   ├── layout.tsx             # Auth guard + navbar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── configuracoes/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── subscriptions/
│   │   │   ├── route.ts           # GET, POST
│   │   │   └── [id]/route.ts      # GET, PATCH, DELETE
│   │   ├── stats/route.ts
│   │   └── image-history/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── globals.css
│   └── layout.tsx                 # Root layout with ThemeProvider
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── subscription-card.tsx
│   ├── subscription-form.tsx      # Add/Edit form
│   ├── stats-bar.tsx
│   ├── image-history-picker.tsx
│   ├── delete-confirm-dialog.tsx
│   ├── category-filter.tsx
│   └── upcoming-payments.tsx
├── lib/
│   ├── mongodb.ts                 # MongoDB client singleton (server-only)
│   ├── auth.ts                    # NextAuth config (server-only)
│   ├── validations.ts             # Zod schemas
│   ├── utils.ts                   # cn(), formatCurrency(), normalizeToMonthly()
│   └── constants.ts               # CATEGORIES, BILLING_CYCLES, CATEGORY_COLORS
├── hooks/
│   ├── use-subscriptions.ts       # SWR or fetch wrapper for client
│   └── use-stats.ts
├── scripts/
│   └── seed-admin.ts              # Run once to create admin user
├── types/
│   └── index.ts                   # Subscription, Stats, ImageHistory interfaces
├── .env.local.example
├── .gitignore                     # Must include .env.local
├── README.md
└── package.json
```

---

## README Requirements

The README must include:
- Project name + description in English (for GitHub discoverability) with a Portuguese subtitle
- Screenshot placeholder section
- Features list (with emoji)
- Tech stack badges
- Installation instructions (clone → install → setup .env.local → run seed script → npm run dev)
- `.env.local.example` contents explained
- How to deploy (Vercel recommended, with MongoDB Atlas)
- Security notes (why credentials never reach the frontend)
- License: MIT

---

## Environment Variables (.env.local.example)

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Admin seed (used only in scripts/seed-admin.ts)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-strong-password
```

---

## Implementation Order

1. Project scaffold (Next.js 15 + TypeScript + Tailwind + shadcn/ui init)
2. MongoDB client singleton + types
3. Zod validation schemas
4. NextAuth setup (CredentialsProvider + JWT)
5. Seed admin script
6. Auth middleware + protected layout
7. Login page UI
8. All API routes (subscriptions CRUD, stats, image-history)
9. Dashboard layout + stats bar
10. Subscription card component
11. Add/Edit form with image history picker
12. Dashboard page wiring (fetch + display + mutations)
13. Upcoming payments panel
14. Settings/configurações page (image history management)
15. Dark/light theme + grain texture
16. Loading skeletons + toast notifications + error states
17. Mobile responsiveness pass
18. README + .env.local.example + .gitignore
