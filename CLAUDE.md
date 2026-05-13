@AGENTS.md

---

# Life OS — Technical Implementation Reference

> Tài liệu này mô tả trạng thái **đã build** của app, dùng để orient Claude trong các session mới.
> Base knowledge (vision, triết lý, kiến trúc 6 tầng) xem ở `c:\Users\Ann\Desktop\ForAnn\Finance\CLAUDE.md`.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.4 (App Router, Turbopack) |
| Styling | Tailwind CSS 4 |
| Backend/Auth/DB | Supabase (PostgreSQL + RLS) |
| AI | Anthropic Claude API (`claude-haiku-4-5-20251001`) |
| Deploy | Vercel |
| Language | TypeScript (strict) |

**Quan trọng:** Next.js 16 đã rename `middleware.ts` → `proxy.ts` và export `middleware()` → `proxy()`. File hiện tại là `src/proxy.ts`.

---

## Routes đã build

```
src/app/
├── page.tsx                  → redirect /dashboard
├── auth/login/page.tsx       → email/password login
├── auth/signup/page.tsx      → redirect về login
└── (app)/                    → layout với sidebar + bottom nav
    ├── dashboard/page.tsx    → trang chính hàng ngày
    ├── transactions/page.tsx → tài chính (thu/chi/ngân sách)
    ├── investments/page.tsx  → đầu tư & tài sản & net worth
    ├── habits/page.tsx       → habit tracker
    ├── health/page.tsx       → sức khỏe (ngủ/vận động/nước) + 7-day strip
    ├── goals/page.tsx        → mục tiêu OKR
    ├── tasks/page.tsx        → task list + MIT
    ├── capture/page.tsx      → quick capture / inbox
    ├── evening/page.tsx      → evening ritual (dynamic steps)
    ├── journal/page.tsx      → nhật ký hàng ngày
    ├── review/page.tsx       → weekly review
    ├── insights/page.tsx     → AI insights (SSR stats + cached AI)
    ├── learning/page.tsx     → kệ sách cá nhân
    ├── me/page.tsx           → profile + life design + life wheel + modules shortcut
    └── modules/page.tsx      → bật/tắt modules + links tới Review & Evening
```

---

## API Routes

```
src/app/api/
├── ai/
│   ├── classify/route.ts           → Claude phân loại quick capture
│   ├── finance-insight/route.ts    → AI phân tích tài chính
│   └── insights/route.ts          → AI insights tổng hợp (24h TTL cache)
├── investments/
│   ├── snapshot/route.ts          → upsert net worth snapshot hàng ngày
│   ├── update-prices/route.ts     → cập nhật giá tài sản
│   ├── live-prices/route.ts       → fetch giá realtime (Claude tool use)
│   ├── ai-insight/route.ts        → AI phân tích portfolio
│   └── transactions/
│       ├── route.ts               → CRUD buy/sell transactions
│       └── [id]/route.ts          → DELETE transaction
└── prices/
    ├── crypto/route.ts            → CoinGecko API
    └── fx/route.ts                → open.er-api tỷ giá
```

**AI Insights Cache pattern** (`insights/route.ts`):
- Check `ai_insights_cache` trong DB, TTL = 24h
- Nếu còn fresh → trả cache, không gọi Anthropic
- `?refresh=1` → force refresh, bỏ qua cache
- Upsert cache sau mỗi lần call AI thành công

---

## Database Schema (toàn bộ tables)

### Chạy theo thứ tự:
1. `schema.sql` → `schema-mvp2.sql` → `schema-mvp3.sql` → `schema-mvp4.sql` → `schema-mvp5.sql`
2. Tất cả files trong `supabase/migrations/`

### Tables hiện có:

#### Core
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `profiles` | User profile | `display_name`, `annual_theme`, `purpose_statement`, `life_chapter`, `core_values text[]`, `energy_peak_start`, `energy_peak_end`, `reading_goal int default 12`, **`enabled_modules text[]`** |
| `happiness_scores` | Điểm hạnh phúc 1-10 | `score`, `note`, `date` (unique per user/day) |
| `inbox_items` | Quick capture inbox | `content`, `classified_as`, `is_processed` |

#### Tài chính (Module A)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `transactions` | Thu/chi | `amount`, `type (income/expense)`, `category`, `note`, `date` |
| `budgets` | Ngân sách tháng | `category`, `monthly_limit` (unique per user/category) |
| `assets` | Tài sản/đầu tư | `asset_type (crypto/gold/stock/savings/real_estate/cash/other)`, `name`, `current_value`, `buy_value`, `quantity`, `unit` |
| `asset_transactions` | Lịch sử mua/bán | `asset_id`, `type (buy/sell)`, `quantity`, `price_per_unit`, `total_value`, `transaction_date` |
| `savings_goals` | Hũ tiết kiệm | `name`, `icon`, `target_amount`, `current_amount`, `target_date` |
| `net_worth_snapshots` | Net worth theo ngày | `snapshot_date`, `total_value`, `by_type jsonb` (unique per user/date) |

#### Sức khỏe (Module B)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `sleep_logs` | Giấc ngủ | `bedtime text`, `wake_time text`, `duration_hours`, `quality 1-5`, `date` |
| `movement_logs` | Vận động/phục hồi | `did_move`, `activity`, `duration_mins`, `felt_after`, `stress_level 1-5`, `recovery_activities text[]`, `meal_quality` |
| `energy_logs` | Năng lượng buổi sáng | `score 1-5`, `factors text[]`, `date` |
| `workouts` *(schema-mvp5)* | Log bài tập | `type`, `duration_minutes`, `note`, `date` |
| `water_logs` *(schema-mvp5)* | Uống nước | `glasses`, `date` |
| `meditation_logs` *(schema-mvp5)* | Thiền | `duration_minutes`, `date` |

#### Habits & Tasks (Module D)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `habits` | Danh sách habits | `name`, `icon`, `sort_order`, `is_active`, `goal_id uuid?`, `start_date`, `challenge_days int?` |
| `habit_logs` | Check-in habit | `habit_id`, `date` (unique per habit/date) |
| `tasks` | Task list | `title`, `is_mit`, `is_done`, `due_date`, `energy_level (high/medium/low)?`, `recurrence (daily/weekly/monthly)?`, `goal_id uuid?` |

#### Goals (Module D)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `goals` | Mục tiêu OKR | `title`, `description`, `timeframe (year/quarter/month)`, `value_tag`, `progress 0-100`, `is_done`, `target_date` |
| `key_results` | Sub-goals (KR) | `goal_id`, `title`, `is_done` |

#### Tinh thần (Module F)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `journal_entries` | Nhật ký hàng ngày | `gratitude`, `morning_focus`, `morning_need`, `evening_win`, `evening_lesson`, `mood 1-5` (unique per user/date) |
| `weekly_reviews` | Weekly review | `week_start date`, `best_thing`, `carry_forward`, `next_priority`, `theme_moment` |

#### Learning (Module C)
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `books` | Kệ sách | `title`, `author`, `status (want/reading/done)`, `rating 1-5`, `notes`, `key_takeaway`, `finished_at date`, `cover_url text` |

#### Me / Tầng 1
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `life_wheel_entries` | Đánh giá life wheel | `assessed_at`, `finance/health/learning/work/relationships/spirit/time` (1-10 mỗi cột) |

#### AI Cache
| Table | Mô tả | Columns đáng chú ý |
|-------|-------|-------------------|
| `ai_insights_cache` | Cache AI insights | `generated_at`, `monthly_story text`, `insights jsonb` (unique per user) |

---

## Component Structure

```
src/components/
├── layout/
│   ├── sidebar.tsx              → Dark sidebar (bg-slate-900), nav items, không có Modules link
│   └── bottom-nav.tsx           → Mobile bottom nav (dynamic tabs theo enabled_modules)
├── dashboard/
│   ├── greeting.tsx             → Welcome + stats summary
│   ├── ai-capture-bar.tsx       → Quick capture với AI classify
│   ├── finance-summary.tsx      → Card tài chính hôm nay + tháng (chỉ khi module finance bật)
│   ├── mit-preview.tsx          → 3 MIT hôm nay
│   ├── habits-preview.tsx       → Habit tick preview
│   ├── goals-preview.tsx        → Goals progress
│   ├── happiness-score-card.tsx → Điểm hạnh phúc 1-10
│   ├── context-zone.tsx         → Zone tổng hợp (right col desktop)
│   └── evening-cta.tsx          → CTA kết thúc ngày (hiện sau 18h)
├── health/
│   └── health-week-strip.tsx    → Strip 7 ngày: energy circle + sleep dots + movement dot
├── evening/
│   └── evening-flow.tsx         → 6-state machine, step counter dynamic (3 hoặc 4 steps)
├── journal/
│   └── journal-form.tsx         → activePeriod prop highlight buổi sáng/tối theo giờ
├── learning/
│   ├── add-book-form.tsx        → Google Books search + manual fallback
│   ├── book-shelf.tsx           → Tabs: đang đọc / đã đọc (với finish flow)
│   ├── want-list.tsx            → Danh sách muốn đọc + nút Bắt đầu
│   ├── takeaways-wall.tsx       → Key takeaway quotes từ sách đã đọc
│   └── reading-goal-bar.tsx     → Progress bar mục tiêu đọc sách/năm
├── insights/
│   └── insights-client.tsx      → 2-col AI insights UI + cache status + refresh
├── investments/
│   ├── investment-list.tsx      → Portfolio list + buy/sell inline
│   ├── net-worth-chart.tsx      → Chart net worth theo thời gian
│   └── savings-goals-list.tsx   → Hũ tiết kiệm
└── modules/
    └── modules-client.tsx       → Toggle modules + quick links tới Review & Evening
```

---

## Design System

- **Sidebar**: `bg-slate-900`, text trắng/slate, active: `bg-white/10 text-white`
- **Content area**: `bg-white` (desktop), `bg-stone-50` (mobile)
- **Cards**: `bg-white rounded-2xl border border-stone-100`
- **Primary action**: `bg-violet-600` hover `bg-violet-700`
- **Font**: Geist (Next.js default)
- **Spacing pattern trang**: `px-4 pt-12 lg:px-8 lg:pt-8 pb-4 space-y-4`
- **2-col layout desktop**: `lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start`
- **Mobile hover pattern**: `lg:opacity-0 lg:group-hover:opacity-100` — actions luôn hiện trên mobile, ẩn trên desktop cho đến khi hover

---

## External Integrations

| Service | Dùng cho | Auth |
|---------|---------|------|
| Google Books API | Search sách khi thêm vào kệ | Không cần API key |
| Anthropic Claude API | AI classify, insights, live prices | `ANTHROPIC_API_KEY` |
| CoinGecko | Giá crypto | Không cần API key |
| open.er-api | Tỷ giá ngoại tệ | Không cần API key |

**next.config.ts image domains**: `books.google.com`, `books.googleusercontent.com`

---

## Env Variables cần có

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

---

## Quyết định kiến trúc quan trọng

### Modules đã XÓA
- **Relationships module** (`/relationships`) — đã xóa hoàn toàn. Bảng `contacts` vẫn tồn tại trong DB nhưng không có UI. Không rebuild lại trừ khi user yêu cầu.

### Patterns chuẩn
- **Server components** fetch data trực tiếp từ Supabase, không dùng `useEffect` để fetch
- **Client components** dùng `router.refresh()` sau mutations (không dùng global state)
- **Supabase client**: `@/lib/supabase/server` cho server components, `@/lib/supabase/client` cho client components
- **Image optimization**: Dùng `next/image` (`<Image />`) thay `<img>` cho external images

### Profile deduplication — `src/lib/get-profile.ts`
Wrapper `React.cache()` quanh Supabase profile query. Layout và Page đều gọi `getProfile(user.id)` — lần 2 trở đi được dedup trong cùng render tree (per request). Không dùng inline `supabase.from('profiles')` nữa.

```typescript
import { cache } from 'react'
export const getProfile = cache(async (userId: string) => { ... })
```

### Anthropic singleton
Khai báo `const anthropic = new Anthropic()` ở **module level** trong tất cả AI routes (`classify`, `finance-insight`, `insights`). Tránh tạo instance mới mỗi request.

### Module system — `enabled_modules text[]` trong `profiles`
- Default khi null: tất cả 9 modules bật (`finance`, `investments`, `habits`, `tasks`, `goals`, `health`, `learning`, `spirit`, `insights`)
- Dashboard dùng `const m = new Set(enabledModules)` → `m.has('finance')` để render conditional
- DB queries trong `Promise.all` dùng `none = Promise.resolve({ data: null })` fallback cho module tắt
- Layout truyền `enabledModules` xuống cả `Sidebar` và `BottomNav`

### Bottom nav mobile — dynamic tabs
Logic trong `bottom-nav.tsx`:
```
0 module bật  → [Modules hub]  [Review]
1 module bật  → [module1]      [Review]
2 module bật  → [module1]      [module2]   ← cả hai trực tiếp
3+ module bật → [module1]      [All hub]   ← hub dẫn tới modules + Review
```
- Thứ tự ưu tiên module: finance → investments → habits → tasks → goals → health → learning → spirit → insights
- Hub = `/modules` page (có quick links tới Review + Evening)
- Quản lý modules (bật/tắt) → **Tôi → Cài đặt → Modules** (không phải sidebar)

### Sidebar PC
- Không còn link Modules (đã chuyển vào Tôi page)
- Bottom section: **Ghi nhanh** (CTA) + **Hồ sơ** (link `/me`)
- Nav groups: **Chính** (Dashboard, Review, Quick Capture) + **Cuộc sống** (modules đang bật)

### Insights page — SSR stats + progressive AI
- Stats (happiness, habits, finance, sleep, energy, movement, correlations) tính **server-side** trong `insights/page.tsx`
- Truyền xuống `InsightsClient` qua `initialData` prop
- Khi cache fresh (< 24h): render đầy đủ không cần client fetch
- Khi cache stale: stats hiển thị ngay, AI section spinner riêng
- `InsightsData`, `Stats`, `Insight` interfaces export từ `insights-client.tsx`

### Dashboard — conditional FinanceSummary
`FinanceSummary` component chỉ render khi `m.has('finance')`. Query `monthTransactions` trong `Promise.all` của dashboard chỉ chạy khi finance module bật.

### Health page — 7-day strip
`health/page.tsx` fetch thêm 3 queries parallel (sleep, movement, energy 7 ngày). `HealthWeekStrip` component hiển thị per-day: energy score circle (màu theo mức) + sleep quality dots (3 dots) + movement dot.

### Evening flow — dynamic step counter
```
totalSteps = (hasHabits ? 1 : 0) + 1 + (hasPurpose ? 1 : 0) + 1
```
Steps: Habits (nếu có) → Happiness → Purpose alignment (nếu có) → MIT ngày mai. Tất cả steps đều hiển thị "Bước X / Y" nhất quán.

### Journal — time-aware highlighting
`JournalForm` nhận `activePeriod?: 'morning' | 'evening'`. Được tính tại server: `hour < 14 → 'morning'`. Section active có border màu nổi bật (amber cho sáng, indigo cho tối).

### Learning page — fallback strategy
`learning/page.tsx` dùng 3-level fallback cho query sách:
1. Full query (có `cover_url` + `key_takeaway`)
2. Không có `cover_url` (nếu migration chưa chạy)
3. Không có cả hai (guaranteed base columns)

### AI Insights caching
- TTL 24 giờ, lưu trong bảng `ai_insights_cache`
- `?refresh=1` để force regenerate
- Stats (không cần AI) luôn tính fresh mỗi lần load

### Investments — fetch cooldown
`investment-overview.tsx` có `COOLDOWN_MS = 15 * 60 * 1000`. Nút "Cập nhật giá" disabled trong 15 phút sau lần fetch gần nhất, tránh spam API.

---

## Migrations đã chạy (cần verify trong Supabase)

Chạy theo thứ tự trong **Supabase Dashboard → SQL Editor**:

```
1. schema.sql
2. schema-mvp2.sql
3. schema-mvp3.sql
4. schema-mvp4.sql
5. schema-mvp5.sql
6. migrations/energy_logs.sql
7. migrations/health_logs.sql
8. migrations/health_nutrition.sql
9. migrations/goals_okr.sql
10. migrations/tasks_energy_recurrence.sql
11. migrations/habits_start_challenge.sql
12. migrations/me_sprint2.sql
13. migrations/net_worth_snapshots.sql
14. migrations/asset_transactions.sql
15. migrations/fix_asset_type_constraint.sql
16. migrations/weekly_reviews.sql
17. migrations/sprint_b.sql
18. migrations/sprint3.sql          ← thêm key_takeaway vào books
19. migrations/books_cover_url.sql  ← thêm cover_url vào books
20. migrations/profiles_reading_goal.sql
21. migrations/ai_insights_cache.sql
```
