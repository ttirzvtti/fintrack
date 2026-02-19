# FinTrack - Budget Manager Web App

## Project Overview
Budget manager web app built for a competition. The user is learning Next.js, TypeScript, Prisma, Tailwind, and GitHub through this project.

## Tech Stack
- **Framework**: Next.js 16 (App Router, `src/` dir)
- **Language**: TypeScript
- **Database**: Neon (PostgreSQL 17, EU Central 1 Frankfurt) via Prisma 7 + `@prisma/adapter-neon` (PrismaNeonHttp)
- **Auth**: NextAuth v5 (beta) — Email+Password, Credentials provider, JWT strategy
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **CSV**: Papa Parse (import), custom export
- **Validation**: Zod v4 (uses `issues` not `errors` on parse failure)
- **Forms**: react-hook-form + @hookform/resolvers
- **Theme**: next-themes (dark/light mode)

## Key Decisions
- Currency lives on Account, not Transaction
- Default currency: RON. Supported: RON, EUR, USD, GBP
- Dashboard groups totals by currency when user has multi-currency accounts
- Prisma 7 requires driver adapters — we use `PrismaNeonHttp`
- Prisma 7 HTTP adapter doesn't support implicit transactions — write then read separately (no `include` on create/update)
- Keywords on Category model for auto-categorization during CSV import
- Demo user: demo@fintrack.app / demo123456
- Radix Select uses `position="popper"` to prevent item-aligned overlap issues

## Known Gotchas (bugs we hit and fixed)
1. **Prisma HTTP adapter**: `create` with `include` fails. Always split into `create` then `findUnique` with `include`.
2. **Zod v4**: Error messages are at `parsed.error.issues[0].message`, NOT `parsed.error.errors`.
3. **Category keywords**: Can be `undefined` on older records — always guard with `const keywords = cat.keywords || []`.
4. **Demo auto-login**: React strict mode double-fires useEffect. Use a `demoTriggered` state guard + `window.location.href` (not `router.push`).
5. **Recharts Tooltip formatter**: Type must be `(value: number | string | undefined, name: string | undefined) => ...`
6. **Dev server restart**: Required after `npx prisma generate` (cached Prisma client).

## All Phases: COMPLETE

### Phase 1 — Foundation
- Email+password auth with auto-login after registration
- Protected routes with middleware (`src/lib/auth.config.ts`)
- Responsive sidebar layout with collapsible menu
- Dashboard with income/expense/balance/count cards (multi-currency)
- Recent transactions table on dashboard
- Full transaction CRUD (create, edit, delete with confirmation)
- Account CRUD with currency selection
- Transaction filters (category, type, date range) stored in URL params
- Toast notifications for all actions (sonner)
- Loading skeletons throughout

### Phase 2 — CSV Import & Analysis
- Analytics page with 3 charts (Recharts): monthly spending bar, category pie, income vs expenses line
- Currency selector for multi-currency users
- CSV import with Papa Parse: upload, column mapping, preview, auto-categorization by keywords
- CSV export from transactions page (fetches all pages with `limit=10000`)
- Category keywords for auto-categorization (11 default categories with Romanian keywords)

### Phase 3 — Budgeting & Goals
- Budget creation per category per month with spending limits
- Budget overview with progress bars (green/amber/red)
- Over-budget warnings and summary cards
- Month navigation (prev/next)
- Savings goals with target amount, currency, optional deadline
- Deposit/withdraw money toward goals
- Goal completion tracking with progress bars

### Phase 4 — Predictions & Smart Features
- Insights page with AI-style smart analysis
- Monthly forecast (current spending, projected end-of-month, 3-month averages)
- 6-month spending trend area chart
- Recurring expense detection (same description + amount)
- Smart insights: category comparison vs last month, top spending, savings rate

### Phase 5 — Polish
- Dark/light mode toggle on landing page + app (next-themes, ThemeProvider)
- Responsive mobile layout (flex-wrap, overflow-auto tables)
- Onboarding welcome card for new users (shown when no accounts)
- Professional landing page with hero, features grid, CTA sections
- Split-layout auth pages (branding left, form right)
- Demo mode with pre-loaded sample data (36 transactions, 5 budgets, 3 goals)
- Logo links: sidebar → /dashboard, auth pages → /

### Phase 6 — Extra Improvements
- Transaction pagination with configurable page size (10/25/50 rows per page selector)
- Search by description with debounced input (300ms)
- Settings page (profile update, password change)
- Custom categories CRUD (create, edit, delete with keyword support for auto-categorization)
- Animated counters on dashboard cards (ease-out cubic, 800ms)
- Page fade-in animation on all app pages (fade-in-up, 0.4s)
- Dashboard period selector (This Month / Last Month / This Year)

### QA Pass (completed)
- All 14 API route tests passed (auth, pages, validation)
- 0 TypeScript errors (fixed 4 Recharts formatter type issues)
- 0 ESLint errors, 0 warnings (fixed 5 unused imports, added error handling)
- Fixed categories API authorization logic bug (was allowing edits to default categories)
- Fixed goals API null assertions (added proper null checks after findUnique)
- Added `.catch()` error handling to all fetch calls (settings, categories, filters)
- Added debounce cleanup on unmount in transaction filters
- ESLint config: disabled `react-hooks/set-state-in-effect` (standard fetch-on-mount pattern), disabled `react-hooks/purity` for shadcn components

## Route Structure
```
/                   → Landing page (public)
/api/demo           → Creates demo user + data, redirects to login?demo=true
(auth)/login        → Login page (auto-login for demo via ?demo=true)
(auth)/register     → Register page
(app)/dashboard     → Dashboard with period selector, animated summary cards, recent transactions
(app)/transactions  → Transaction list + CRUD + filters + search + pagination + CSV export
(app)/accounts      → Account cards + CRUD
(app)/analytics     → Charts (bar, pie, line) with currency selector
(app)/budgets       → Budget progress bars with month navigation
(app)/goals         → Savings goals with deposit/withdraw
(app)/insights      → Forecast, trends, recurring detection, smart insights
(app)/import        → CSV import (upload → map columns → preview with auto-categorize → import)
(app)/categories    → Custom categories management (create/edit/delete, view defaults)
(app)/settings      → Profile name edit + password change
```

## API Routes
- `POST /api/register` — Create user account
- `GET /api/demo` — Create demo user with sample data, redirect to login
- `GET/POST /api/accounts` — List/create bank accounts
- `PUT/DELETE /api/accounts/[id]` — Update/delete account
- `GET/POST /api/transactions` — List (with filters, pagination, search)/create transactions
  - GET params: categoryId, type, dateFrom, dateTo, search, page, pageSize, limit
- `PUT/DELETE /api/transactions/[id]` — Update/delete transaction
- `GET/POST /api/categories` — List/create categories
- `PUT/DELETE /api/categories/[id]` — Update/delete custom category (default categories protected)
- `GET /api/dashboard` — Summary grouped by currency (param: period=this-month|last-month|this-year)
- `GET /api/analytics` — Chart data (monthly spending, categories, income vs expenses)
- `GET/POST /api/budgets` — List/create budgets with spending data
- `DELETE /api/budgets/[id]` — Delete budget
- `GET/POST /api/goals` — List/create savings goals
- `PUT/DELETE /api/goals/[id]` — Update (deposit/withdraw)/delete goal
- `POST /api/import` — Bulk import transactions from CSV
- `PUT /api/import` — Auto-categorize descriptions against category keywords
- `GET /api/insights` — Forecast, recurring, smart insights
- `GET/PUT /api/settings` — User profile (GET) and update name or change password (PUT)

## Database Models (prisma/schema.prisma)
- **User**: id, name, email, password, createdAt, updatedAt
- **Account**: id, name, type (CHECKING/SAVINGS/CREDIT/CASH), currency, userId
- **Transaction**: id, amount (Decimal), type (INCOME/EXPENSE), description, date, accountId, categoryId
- **Category**: id, name, icon, isDefault, userId (null for defaults), keywords[]
- **Budget**: id, userId, categoryId, monthlyLimit (Decimal), month, year (@@unique on userId+categoryId+month+year)
- **SavingsGoal**: id, userId, name, targetAmount (Decimal), currentAmount (Decimal), currency, deadline

## Protected Routes (src/lib/auth.config.ts)
All routes under (app)/ are protected: /dashboard, /transactions, /accounts, /analytics, /budgets, /goals, /insights, /import, /settings, /categories

## Key Component Files
- `src/lib/db.ts` — PrismaNeonHttp adapter singleton
- `src/lib/auth.ts` — NextAuth v5 config with Credentials provider
- `src/lib/auth.config.ts` — Edge-safe middleware config with protected routes
- `src/lib/validations.ts` — Zod schemas (client + API versions with coercion)
- `src/lib/currency.ts` — formatCurrency helper + SUPPORTED_CURRENCIES
- `src/hooks/use-animated-counter.ts` — Animated number hook (ease-out cubic)
- `src/components/layout/app-sidebar.tsx` — Sidebar with all nav items
- `src/components/layout/user-nav.tsx` — User dropdown (settings link + logout + theme toggle)
- `src/components/theme-toggle.tsx` — Reusable sun/moon toggle (used on landing page)
- `src/components/ui/animated-number.tsx` — AnimatedCurrency + AnimatedInteger components

## Setup Commands
```bash
npm run db:push         # Push schema to Neon
npx tsx prisma/seed.ts  # Seed default categories (11 with keywords)
npm run db:generate     # Regenerate Prisma client (MUST restart dev server after)
npm run dev             # Start dev server on port 3000
```

## Environment Variables (.env)
- `DATABASE_URL` — Neon pooled connection string
- `DIRECT_URL` — Neon direct connection string (same as DATABASE_URL for this setup)
- `AUTH_SECRET` — Generated via `openssl rand -base64 32`
- `AUTH_URL` — `http://localhost:3000` (change for production)

## Next Steps (pending)
- **Push to GitHub + deploy to Vercel** (task #21 — user said they'll do tomorrow)
- Potential improvements suggested but not yet chosen:
  - Dashboard mini-widgets (budget alerts + goal progress on dashboard)
  - Recurring transactions (auto-generate monthly)
  - Account balance tracking per account
  - Better empty states with illustrations
  - Keyboard shortcuts (N for new transaction, / for search)
  - Financial reports (monthly summary, printable/PDF)
