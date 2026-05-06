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
    ├── health/page.tsx       → sức khỏe (ngủ/vận động/nước)
    ├── goals/page.tsx        → mục tiêu OKR
    ├── tasks/page.tsx        → task list + MIT
    ├── capture/page.tsx      → quick capture / inbox
    ├── evening/page.tsx      → evening ritual (5 bước)
    ├── journal/page.tsx      → nhật ký hàng ngày
    ├── review/page.tsx       → weekly review
    ├── insights/page.tsx     → AI insights (cached)
    ├── learning/page.tsx     → kệ sách cá nhân
    ├── me/page.tsx           → profile + life design + life wheel
    └── modules/page.tsx      → module navigation
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
| `profiles` | User profile | `display_name`, `annual_theme`, `purpose_statement`, `life_chapter`, `core_values text[]`, `energy_peak_start`, `energy_peak_end`, `reading_goal int default 12` |
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
│   ├── sidebar.tsx          → Dark sidebar (bg-slate-900), nav items
│   └── bottom-nav.tsx       → Mobile bottom navigation
├── dashboard/
│   ├── greeting.tsx         → Welcome + energy check-in
│   ├── ai-capture-bar.tsx   → Quick capture với AI classify
│   ├── mit-preview.tsx      → 3 MIT hôm nay
│   ├── habits-preview.tsx   → Habit tick preview
│   ├── goals-preview.tsx    → Goals progress
│   ├── health-summary.tsx   → Sleep/energy summary
│   ├── happiness-score-card.tsx → Điểm hạnh phúc 1-10
│   ├── context-zone.tsx     → Zone tổng hợp
│   └── evening-cta.tsx      → CTA kết thúc ngày (hiện sau 18h)
├── learning/
│   ├── add-book-form.tsx    → Google Books search + manual fallback
│   ├── book-shelf.tsx       → Tabs: đang đọc / đã đọc (với finish flow)
│   ├── want-list.tsx        → Danh sách muốn đọc + nút Bắt đầu
│   ├── takeaways-wall.tsx   → Key takeaway quotes từ sách đã đọc
│   └── reading-goal-bar.tsx → Progress bar mục tiêu đọc sách/năm
├── insights/
│   └── insights-client.tsx  → 2-col AI insights UI + cache status + refresh
├── investments/
│   ├── investment-list.tsx  → Portfolio list + buy/sell inline
│   ├── net-worth-chart.tsx  → Chart net worth theo thời gian
│   └── savings-goals-list.tsx → Hũ tiết kiệm
└── ... (các module khác)
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

### Module đã XÓA
- **Relationships module** (`/relationships`) — đã xóa hoàn toàn. Bảng `contacts` vẫn tồn tại trong DB nhưng không có UI. Không rebuild lại trừ khi user yêu cầu.

### Patterns chuẩn
- **Server components** fetch data trực tiếp từ Supabase, không dùng `useEffect` để fetch
- **Client components** dùng `router.refresh()` sau mutations (không dùng global state)
- **Supabase client**: `@/lib/supabase/server` cho server components, `@/lib/supabase/client` cho client components
- **Image optimization**: Dùng `next/image` (`<Image />`) thay `<img>` cho external images

### Learning page — fallback strategy
`learning/page.tsx` dùng 3-level fallback cho query sách:
1. Full query (có `cover_url` + `key_takeaway`)
2. Không có `cover_url` (nếu migration chưa chạy)
3. Không có cả hai (guaranteed base columns)

### AI Insights caching
- TTL 24 giờ, lưu trong bảng `ai_insights_cache`
- `?refresh=1` để force regenerate
- Stats (không cần AI) luôn tính fresh mỗi lần load

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
