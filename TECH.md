# Life OS — Giải thích Source Code cho người học IT

> Tài liệu này giải thích **tại sao** code được viết như vậy, không chỉ **cái gì**.
> Đọc từ trên xuống dưới lần đầu. Sau đó dùng làm tài liệu tham khảo.

---

## Mục lục

1. [Bức tranh toàn cảnh](#1-bức-tranh-toàn-cảnh)
2. [Tech Stack — Tại sao chọn từng thứ](#2-tech-stack--tại-sao-chọn-từng-thứ)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Luồng request — Một request đi qua đâu?](#4-luồng-request--một-request-đi-qua-đâu)
5. [Authentication — Đăng nhập hoạt động thế nào?](#5-authentication--đăng-nhập-hoạt-động-thế-nào)
6. [Database Design — Supabase & PostgreSQL](#6-database-design--supabase--postgresql)
7. [React Patterns — Server vs Client Components](#7-react-patterns--server-vs-client-components)
8. [Data Fetching — Cách lấy data từ DB](#8-data-fetching--cách-lấy-data-từ-db)
9. [API Routes — Backend trong Next.js](#9-api-routes--backend-trong-nextjs)
10. [AI Integration — Claude API hoạt động thế nào?](#10-ai-integration--claude-api-hoạt-động-thế-nào)
11. [Utility Functions — Các hàm dùng chung](#11-utility-functions--các-hàm-dùng-chung)
12. [UI Patterns — Cách xây dựng giao diện](#12-ui-patterns--cách-xây-dựng-giao-diện)
13. [Mutations — Cách cập nhật dữ liệu](#13-mutations--cách-cập-nhật-dữ-liệu)
14. [Bài học rút ra — Các pattern quan trọng](#14-bài-học-rút-ra--các-pattern-quan-trọng)

---

## 1. Bức tranh toàn cảnh

```
NGƯỜI DÙNG
    │ mở browser
    ▼
NEXT.JS 16 (chạy trên Vercel)
    │
    ├── src/proxy.ts         ← Kiểm tra đăng nhập TRƯỚC khi load bất kỳ trang nào
    │
    ├── src/app/             ← Các trang (Pages)
    │       │
    │       └── Mỗi trang gọi SUPABASE để lấy data
    │
    ├── src/components/      ← Các thành phần UI tái sử dụng
    │
    └── src/app/api/         ← API endpoints (gọi AI, cập nhật giá...)
            │
            └── Gọi ANTHROPIC (Claude AI)
                Gọi SUPABASE để đọc/ghi DB

SUPABASE (PostgreSQL trên cloud)
    ├── Auth (quản lý tài khoản, session, JWT)
    └── Database (tất cả data của user)
```

**Điều quan trọng nhất:** App này là **full-stack** — cùng một codebase chứa cả frontend (giao diện) lẫn backend (API). Đây là sức mạnh của Next.js.

---

## 2. Tech Stack — Tại sao chọn từng thứ?

### Next.js 16 (Framework chính)
**Next.js là gì?** Framework React cho phép viết cả frontend và backend trong cùng một project.

**Tại sao không dùng React thuần?**
- React thuần chỉ chạy ở browser → mọi data fetch đều từ browser → chậm và không an toàn
- Next.js chạy cả ở server → trang được render sẵn → nhanh hơn, SEO tốt hơn, bảo mật hơn

**App Router (Next.js 13+):**
Cách định tuyến mới: **mỗi folder trong `src/app/` = một URL**.
```
src/app/(app)/dashboard/page.tsx  →  yourapp.com/dashboard
src/app/(app)/habits/page.tsx     →  yourapp.com/habits
src/app/auth/login/page.tsx       →  yourapp.com/auth/login
```

Dấu ngoặc `(app)` là **Route Group** — nhóm các trang lại mà không ảnh hưởng URL.

### Supabase (Backend as a Service)
**Supabase là gì?** Dịch vụ cung cấp sẵn: PostgreSQL database + Authentication + API — không cần tự setup server.

**Tại sao không tự viết backend?**
- Tiết kiệm thời gian: Auth, DB, API tất cả đã có sẵn
- Bảo mật: Supabase xử lý JWT, password hashing, session management
- Miễn phí cho personal use

### TypeScript (Ngôn ngữ)
**TypeScript là gì?** JavaScript + kiểu dữ liệu (type annotations).

**Tại sao?**
```typescript
// JavaScript — không biết `user` có property `name` không
function greet(user) {
  return user.name  // lỗi chỉ phát hiện khi chạy
}

// TypeScript — biết ngay khi gõ code
interface User { name: string; email: string }
function greet(user: User) {
  return user.name  // IDE tự gợi ý, lỗi bắt ngay lúc build
}
```

### Tailwind CSS (Styling)
**Tailwind là gì?** CSS framework dùng các class có sẵn thay vì viết CSS từ đầu.

```tsx
// Thay vì viết CSS file riêng...
// .card { background: white; border-radius: 16px; padding: 16px; }

// Tailwind: viết thẳng vào component
<div className="bg-white rounded-2xl p-4">...</div>
```

---

## 3. Cấu trúc thư mục

```
life-os/
├── src/
│   ├── app/                    ← TẤT CẢ các trang + API
│   │   ├── layout.tsx          ← Layout gốc (HTML, font, metadata)
│   │   ├── page.tsx            ← Trang "/" (redirect sang /dashboard)
│   │   ├── globals.css         ← CSS global (reset, Tailwind)
│   │   │
│   │   ├── (app)/              ← Nhóm các trang CẦN đăng nhập
│   │   │   ├── layout.tsx      ← Layout với Sidebar + BottomNav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   └── ... (14 trang nữa)
│   │   │
│   │   ├── auth/               ← Trang đăng nhập/đăng ký
│   │   │   └── login/page.tsx
│   │   │
│   │   └── api/                ← API endpoints (backend)
│   │       ├── ai/classify/route.ts
│   │       ├── ai/insights/route.ts
│   │       └── investments/...
│   │
│   ├── components/             ← UI components tái sử dụng
│   │   ├── ui/                 ← Components gốc (Button, Input, Card...)
│   │   ├── layout/             ← Sidebar, BottomNav
│   │   ├── dashboard/          ← Components cho trang Dashboard
│   │   ├── learning/           ← Components cho trang Learning
│   │   └── ... (mỗi module 1 folder)
│   │
│   └── lib/                    ← Utility functions & helpers
│       ├── supabase/
│       │   ├── client.ts       ← Supabase client cho BROWSER
│       │   └── server.ts       ← Supabase client cho SERVER
│       ├── format.ts           ← Format tiền, ngày tháng
│       ├── categories.ts       ← Danh mục thu/chi
│       ├── utils.ts            ← Hàm cn() merge Tailwind classes
│       └── parse-amount.ts     ← Parse "50k" → 50000
│
├── proxy.ts                    ← Guard đăng nhập (Next.js Proxy)
├── next.config.ts              ← Cấu hình Next.js
├── supabase/
│   ├── schema.sql              ← Database schema ban đầu
│   ├── schema-mvp2.sql         ← Schema mở rộng
│   └── migrations/             ← Các thay đổi DB sau này
└── package.json                ← Dependencies
```

**Quy tắc đặt tên file:**
- `page.tsx` = trang (Next.js sẽ tự biết đây là route)
- `layout.tsx` = layout bọc ngoài các trang con
- `route.ts` = API endpoint
- `*.tsx` = file có JSX (HTML trong JavaScript)
- `*.ts` = file TypeScript thuần (không có JSX)

---

## 4. Luồng request — Một request đi qua đâu?

Khi user mở `yourapp.com/dashboard`:

```
Browser gửi request GET /dashboard
        │
        ▼
[1] proxy.ts — Kiểm tra cookie session
    - Có session hợp lệ?  → Tiếp tục
    - Không có session?   → Redirect về /auth/login
        │
        ▼
[2] src/app/(app)/layout.tsx — AppLayout
    - Đây là SERVER component
    - Gọi Supabase lấy displayName + annualTheme từ profiles
    - Render ra HTML: <Sidebar> + <BottomNav> + {children}
        │
        ▼
[3] src/app/(app)/dashboard/page.tsx — DashboardPage
    - Đây là SERVER component
    - Gọi Promise.all() để fetch song song 11 queries từ DB
    - Tính toán dữ liệu (habitsWithStatus, goalsForDashboard...)
    - Render ra HTML với data đã có
        │
        ▼
[4] Browser nhận HTML hoàn chỉnh
    - Hiển thị ngay (không cần chờ JavaScript load)
    - Sau đó JavaScript "hydrate" → các button, form bắt đầu hoạt động
```

**Key insight:** Steps 1-3 chạy trên SERVER. User nhận được trang với data đã điền sẵn — không có loading spinner.

---

## 5. Authentication — Đăng nhập hoạt động thế nào?

### Cơ chế JWT + Cookie

```
User nhập email/password
        │
        ▼
Supabase kiểm tra credentials
        │
        ▼
Supabase tạo JWT (JSON Web Token)
JWT = một chuỗi mã hóa chứa: user_id, email, expiry time
JWT được lưu vào COOKIE của browser
        │
        ▼
Mỗi request tiếp theo:
browser tự động gửi cookie → server đọc JWT → biết user là ai
```

### Ba nơi xử lý auth

**1. `src/proxy.ts` — Guard ở cổng vào**
```typescript
export async function proxy(request: NextRequest) {
  // Mỗi request đều đi qua đây trước
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
    // → Không có session? Quay về trang login
  }
}
```

**2. `src/lib/supabase/server.ts` — Đọc session từ cookie (server side)**
```typescript
export async function createClient() {
  const cookieStore = await cookies()  // Đọc cookies từ request
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      // ...
    }
  })
}
```

**3. `src/lib/supabase/client.ts` — Dùng trong browser**
```typescript
export function createClient() {
  return createBrowserClient(URL, KEY)
  // Browser client tự động quản lý session trong localStorage/cookies
}
```

### Tại sao có 2 Supabase client?

| | Server Client | Browser Client |
|--|--|--|
| **Dùng ở** | Server Components, API Routes | Client Components (`'use client'`) |
| **Đọc session từ** | HTTP Cookie trong request headers | localStorage / Cookie của browser |
| **Khi nào** | Khi render trang (server-side) | Khi user click, submit form |

**Rule bắt buộc:** Trong file có `'use client'` → dùng `@/lib/supabase/client`. Còn lại → dùng `@/lib/supabase/server`.

### Row Level Security (RLS) — Bảo mật ở tầng Database

Mỗi bảng trong Supabase đều có policy:
```sql
-- Ví dụ policy bảng transactions:
create policy "Users manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  -- auth.uid() = ID của user đang đăng nhập
  -- user_id = cột trong bảng
  -- Chỉ SELECT/INSERT/UPDATE/DELETE được rows của chính mình
```

Nghĩa là: **dù code có bug, một user cũng không thể đọc data của user khác** — DB tự chặn ở tầng thấp nhất.

---

## 6. Database Design — Supabase & PostgreSQL

### Nguyên tắc thiết kế

Mọi bảng đều có cấu trúc chung:
```sql
create table if not exists ten_bang (
  id         uuid primary key default gen_random_uuid(),
  -- ^ Mỗi row có ID duy nhất, tự tạo (UUID = chuỗi ngẫu nhiên 128-bit)

  user_id    uuid references auth.users(id) on delete cascade not null,
  -- ^ Link về user. ON DELETE CASCADE = xóa user → xóa luôn data của họ

  -- ... các cột dữ liệu ...

  created_at timestamptz default now()
  -- ^ Lưu thời gian tạo, tự điền
);
```

### Quan hệ giữa các bảng

```
auth.users (Supabase quản lý)
    │
    ├── profiles (1:1) — thông tin cá nhân
    ├── transactions (1:many) — giao dịch
    ├── habits (1:many)
    │       └── habit_logs (1:many) — lịch sử tick
    ├── goals (1:many)
    │       ├── key_results (1:many) — OKR sub-goals
    │       └── tasks.goal_id (foreign key, optional)
    ├── assets (1:many) — tài sản đầu tư
    │       └── asset_transactions (1:many) — lịch sử mua/bán
    └── books (1:many) — kệ sách
```

### Constraint — Ràng buộc dữ liệu

```sql
status text not null default 'want'
  check (status in ('want', 'reading', 'done'))
-- Chỉ chấp nhận 3 giá trị này, không thể insert giá trị khác
-- "Contract" ở tầng DB, không phụ thuộc vào code

rating integer check (rating >= 1 and rating <= 5)
-- rating phải từ 1 đến 5

unique(user_id, date)
-- Mỗi user chỉ có 1 record per ngày (ví dụ: sleep_logs)
```

### UUID vs Auto-increment ID

Project dùng UUID (`gen_random_uuid()`) thay vì số tự tăng (1, 2, 3...).

**Tại sao?**
- UUID: `550e8400-e29b-41d4-a716-446655440000` — không đoán được
- Auto-increment: `1, 2, 3` — dễ bị tấn công (brute force `/api/users/1`, `/api/users/2`...)
- UUID an toàn hơn cho distributed systems

---

## 7. React Patterns — Server vs Client Components

Đây là khái niệm **quan trọng nhất** trong Next.js App Router.

### Server Component (mặc định)

```typescript
// src/app/(app)/dashboard/page.tsx
// KHÔNG có 'use client' ở đầu → Server Component

export default async function DashboardPage() {
  // ✅ Có thể dùng async/await trực tiếp
  const supabase = await createClient()

  // ✅ Có thể fetch database trực tiếp
  const { data: profile } = await supabase.from('profiles').select('*')

  // ✅ Không cần API endpoint — đọc DB trực tiếp trong component
  return <div>{profile?.display_name}</div>
}
```

**Đặc điểm:**
- Chạy trên SERVER
- Không có `useState`, `useEffect`, event handlers
- Có thể `async/await` trực tiếp
- Không gửi JavaScript về browser (nhẹ hơn)

### Client Component

```typescript
// src/components/dashboard/energy-check-in.tsx
'use client'  // ← BẮT BUỘC phải khai báo
// Dấu hiệu: cần tương tác (click, input, animation...)

import { useState } from 'react'

export function EnergyCheckIn({ userId, todayLog }) {
  const [selected, setSelected] = useState(null)  // ✅ useState OK

  async function handleClick(score) {
    setSelected(score)  // ✅ Cập nhật UI ngay lập tức
    const supabase = createClient()  // Dùng browser client
    await supabase.from('energy_logs').upsert({ user_id: userId, score })
    router.refresh()  // Báo Next.js reload data từ server
  }

  return <button onClick={() => handleClick(5)}>Năng lượng cao</button>
}
```

**Đặc điểm:**
- Chạy trên BROWSER
- Có thể dùng `useState`, `useEffect`, event handlers
- Gửi JavaScript về browser
- Không thể async ở component level (phải dùng trong hàm)

### Pattern phổ biến: Server fetch → Client interact

```
DashboardPage (Server)
    ├── Fetch data từ DB
    └── Truyền data xuống component con

        EnergyCheckIn (Client)
            ├── Nhận data từ server qua props
            ├── Cho user tương tác (click)
            └── Gọi Supabase để cập nhật
                → router.refresh() → server refetch data mới
```

---

## 8. Data Fetching — Cách lấy data từ DB

### Pattern 1: Parallel fetching (song song)

```typescript
// src/app/(app)/dashboard/page.tsx
const [
  { data: profile },
  { data: habits },
  { data: tasks },
  // ... 8 queries khác
] = await Promise.all([
  supabase.from('profiles').select('*').eq('id', user.id).single(),
  supabase.from('habits').select('*').eq('user_id', user.id),
  supabase.from('tasks').select('*').eq('user_id', user.id),
  // ...
])
```

**Tại sao dùng `Promise.all()`?**
Nếu không, các query chạy tuần tự: 100ms + 80ms + 90ms = **270ms**
Với `Promise.all()`, chạy song song: max(100ms, 80ms, 90ms) = **100ms**

### Pattern 2: Conditional fetching (fallback)

```typescript
// src/app/(app)/learning/page.tsx
// Thử query đầy đủ trước
const { data: booksWithCover, error } = await supabase
  .from('books').select('id, title, ... cover_url')

if (booksWithCover) {
  allBooks = booksWithCover   // ✅ Thành công
} else if (error) {
  // Có thể cột cover_url chưa tồn tại → thử không có cover_url
  const { data: booksBase } = await supabase
    .from('books').select('id, title, ...')  // không có cover_url
  allBooks = booksBase.map(b => ({ ...b, cover_url: null }))
}
```

**Tại sao cần fallback?** Database migrations (thêm cột mới) có thể chưa được chạy. Code cần handle gracefully.

### Supabase Query Builder

```typescript
// Cú pháp giống SQL nhưng viết dạng method chain
supabase
  .from('transactions')           // FROM transactions
  .select('id, amount, category') // SELECT id, amount, category
  .eq('user_id', user.id)        // WHERE user_id = '...'
  .eq('type', 'expense')         // AND type = 'expense'
  .gte('date', '2026-01-01')     // AND date >= '2026-01-01'
  .order('date', { ascending: false }) // ORDER BY date DESC
  .limit(10)                     // LIMIT 10
```

---

## 9. API Routes — Backend trong Next.js

### Khi nào dùng API Route thay vì Server Component?

| Tình huống | Dùng |
|------------|------|
| Fetch data để render trang | Server Component |
| Gọi external API (AI, giá crypto) | API Route |
| Logic phức tạp, cần cache | API Route |
| Cần gọi từ nhiều chỗ | API Route |

### Cấu trúc một API Route

```typescript
// src/app/api/ai/classify/route.ts
import { NextResponse } from 'next/server'

// Tên function = HTTP method
export async function POST(req: Request) {
  // 1. Parse body
  const { text } = await req.json()

  // 2. Validate
  if (!text?.trim()) return NextResponse.json({ error: 'Empty' }, { status: 400 })

  // 3. Xử lý (gọi AI, đọc DB, tính toán...)
  const result = await callClaudeAI(text)

  // 4. Trả về
  return NextResponse.json(result)
}
```

**URL của route này:** `POST /api/ai/classify`

### Gọi API Route từ Client Component

```typescript
// Trong một Client Component
const response = await fetch('/api/ai/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'ăn phở 50k' }),
})
const data = await response.json()
// data = { type: 'expense', amount: 50000, category: 'food' }
```

---

## 10. AI Integration — Claude API hoạt động thế nào?

### Quick Capture AI Classify

```
User gõ: "ăn phở 50k"
    │
    ▼
POST /api/ai/classify
    │
    ▼
Gửi đến Claude API với system prompt:
    "Classify Vietnamese personal finance text.
     Return ONLY valid JSON..."
    │
    ▼
Claude trả về: {"type":"expense","amount":50000,"category":"food"}
    │
    ▼
App tự điền form với data này
```

**System Prompt quan trọng:**
```typescript
const systemPrompt = `Classify Vietnamese personal finance text.
Return ONLY valid JSON, no markdown, no explanation.
// ↑ Rất quan trọng: nếu không nói rõ, AI có thể thêm "Đây là JSON của bạn: ..."

Amount rules: k=×1000, tr/triệu=×1000000.
// ↑ Dạy AI cách parse tiền Việt Nam

"ăn phở 50k" → {"type":"expense","amount":50000,...}
// ↑ Few-shot examples: cho AI xem ví dụ cụ thể → kết quả chính xác hơn nhiều`
```

### AI Insights với Caching (24h TTL)

```typescript
// src/app/api/ai/insights/route.ts

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === '1'

  // 1. Tính stats (không cần AI)
  const stats = await computeStats(userId)

  // 2. Kiểm tra cache
  if (!forceRefresh) {
    const { data: cache } = await supabase
      .from('ai_insights_cache')
      .select('generated_at, monthly_story, insights')
      .eq('user_id', userId).single()

    const ageHours = (Date.now() - new Date(cache.generated_at).getTime()) / 3_600_000
    if (ageHours < 24) {
      return NextResponse.json({ ...stats, ...cache, fromCache: true })
      // ↑ Trả cache ngay, không tốn tiền AI
    }
  }

  // 3. Gọi AI (chỉ khi cache hết hạn hoặc force refresh)
  const aiResult = await callClaude(stats)

  // 4. Lưu vào cache
  await supabase.from('ai_insights_cache').upsert({ user_id: userId, ...aiResult })

  return NextResponse.json({ ...stats, ...aiResult, fromCache: false })
}
```

**Tại sao cần cache?**
- Mỗi lần gọi Claude API = tốn tiền (~$0.01-0.05)
- User mở trang insights nhiều lần/ngày = tốn nhiều
- Insights không thay đổi trong 24h = cache hoàn toàn hợp lệ

---

## 11. Utility Functions — Các hàm dùng chung

### `src/lib/format.ts`

```typescript
// Tại sao cần localDateStr() thay vì new Date().toISOString()?
// Vấn đề: Server chạy ở UTC, user ở UTC+7 (Việt Nam)
// new Date().toISOString() = "2026-05-06T17:00:00Z" → ngày 6 tháng 5
// Nhưng user đang thấy ngày 7 tháng 5 trên máy tính!

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')  // padStart: "5" → "05"
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`  // "2026-05-07" (đúng múi giờ local)
}
```

### `src/lib/parse-amount.ts`

```typescript
// Parse tiền Việt Nam thông minh
parseSmartAmount("50k")     // → { vnd: 50000 }
parseSmartAmount("1.5tr")   // → { vnd: 1500000 }
parseSmartAmount("2tỷ")     // → { vnd: 2000000000 }
parseSmartAmount("$100")    // → { fxCurrency: 'USD', fxAmount: 100 }

// Thuật toán: duyệt qua danh sách suffix theo thứ tự dài nhất trước
// "triệu" phải kiểm tra trước "tr" (vì "triệu" chứa "tr")
```

### `src/lib/utils.ts`

```typescript
// cn() = "class names" — merge Tailwind classes thông minh
import { clsx } from 'clsx'         // Ghép string điều kiện
import { twMerge } from 'tailwind-merge'  // Xử lý conflict Tailwind

cn('px-4 py-2', condition && 'bg-red-500', 'bg-blue-500')
// → 'px-4 py-2 bg-blue-500'
// twMerge: bg-red-500 bị ghi đè bởi bg-blue-500 (không bị duplicate)

// Dùng khắp nơi trong components:
className={cn('base-class', isActive && 'active-class', className)}
```

### `src/lib/categories.ts`

```typescript
// Lazy seeding: lần đầu user dùng, tự tạo categories mặc định
export async function getUserCategories(supabase, userId) {
  const { data } = await supabase.from('categories').select('*').eq('user_id', userId)

  if (data && data.length > 0) return data  // Đã có → trả về

  // Chưa có → seed defaults
  const toInsert = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: userId }))
  const { data: seeded } = await supabase.from('categories').insert(toInsert).select()
  return seeded
}
```

---

## 12. UI Patterns — Cách xây dựng giao diện

### Pattern: Component nhận props từ Server

```typescript
// Server Component (page.tsx) — có data
const books = await supabase.from('books').select('*')

return (
  <BookShelf
    books={books}          // Truyền data xuống
    userId={user.id}       // Truyền ID để component con có thể mutate
    defaultTab="reading"   // Config
  />
)

// Client Component (book-shelf.tsx) — có interactivity
'use client'
export function BookShelf({ books, userId, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  // books đã có sẵn từ server — không cần fetch lại
}
```

### Pattern: Optimistic UI

```typescript
// Cập nhật UI ngay, không chờ server confirm
async function toggleHabit(habitId: string) {
  // 1. Cập nhật local state ngay lập tức (UI phản hồi ngay)
  setDoneIds(prev => {
    const next = new Set(prev)
    next.has(habitId) ? next.delete(habitId) : next.add(habitId)
    return next
  })

  // 2. Gửi lên server (bất đồng bộ)
  const supabase = createClient()
  await supabase.from('habit_logs').upsert({ habit_id: habitId, date: today })

  // 3. Sync lại với server (để đảm bảo nhất quán)
  router.refresh()
}
```

**Tại sao?** User click tick habit → thấy ngay tick ✓ → không cảm thấy lag dù mạng chậm.

### Pattern: Tab UI với state

```typescript
const [activeTab, setActiveTab] = useState('reading')

// Tabs
<div className="flex rounded-xl overflow-hidden border border-stone-200">
  {['reading', 'done'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={cn(
        'flex-1 py-2 text-sm',
        activeTab === tab
          ? 'bg-violet-600 text-white'   // Active: tím đậm
          : 'text-stone-400'             // Inactive: xám
      )}
    >
      {tab}
    </button>
  ))}
</div>

// Content thay đổi theo tab
const visibleBooks = books.filter(b => b.status === activeTab)
```

---

## 13. Mutations — Cách cập nhật dữ liệu

### Vòng lặp cập nhật chuẩn

```
User action (click/submit)
        │
        ▼
Client Component xử lý
        │
        ├── setSaving(true)     → Disable button, hiện spinner
        ├── Gọi Supabase        → Ghi vào DB
        ├── setSaving(false)    → Enable button lại
        └── router.refresh()   → Báo Next.js refetch data từ server
                │
                ▼
        Server Component re-render
        với data mới từ DB → UI cập nhật
```

### Insert (thêm mới)

```typescript
const { error } = await supabase.from('books').insert({
  user_id: userId,    // BẮT BUỘC — để RLS policy cho phép
  title: 'Atomic Habits',
  status: 'want',
})
if (error) { setError(true); return }
router.refresh()
```

### Upsert (thêm hoặc cập nhật)

```typescript
// Nếu đã có record với (user_id, date) → UPDATE
// Nếu chưa có → INSERT
await supabase.from('happiness_scores').upsert({
  user_id: userId,
  date: today,
  score: 8,
})
// Hữu ích cho: habit_logs, sleep_logs, energy_logs
// (mỗi ngày chỉ có 1 record)
```

### Update (cập nhật)

```typescript
await supabase
  .from('books')
  .update({ status: 'reading' })  // Chỉ cập nhật field này
  .eq('id', bookId)               // WHERE id = bookId
  .eq('user_id', userId)          // AND user_id = userId (bảo mật)
```

### Delete (xóa)

```typescript
await supabase
  .from('books')
  .delete()
  .eq('id', bookId)
  .eq('user_id', userId)  // LUÔN thêm user_id để tránh xóa nhầm
```

---

## 14. Bài học rút ra — Các pattern quan trọng

### 1. Never trust the client

```typescript
// ❌ SAI — user có thể giả mạo userId trong body
const { userId } = await req.json()
await supabase.from('transactions').insert({ user_id: userId, ... })

// ✅ ĐÚNG — lấy userId từ session (server tự xác thực)
const { data: { user } } = await supabase.auth.getUser()
await supabase.from('transactions').insert({ user_id: user.id, ... })
```

### 2. Luôn thêm user_id khi mutate

```typescript
// Mọi INSERT/UPDATE/DELETE đều phải có .eq('user_id', userId)
// Dù RLS đã bảo vệ, đây là defense in depth (bảo mật nhiều lớp)
```

### 3. router.refresh() thay vì state management phức tạp

```typescript
// Thay vì Redux/Zustand, chỉ cần:
router.refresh()  // Next.js tự refetch data ở server → re-render
// Đơn giản hơn nhiều, data luôn nhất quán với DB
```

### 4. Promise.all() cho parallel fetching

```typescript
// ❌ Chậm: 100 + 80 + 90 = 270ms
const a = await queryA()
const b = await queryB()
const c = await queryC()

// ✅ Nhanh: max(100, 80, 90) = 100ms
const [a, b, c] = await Promise.all([queryA(), queryB(), queryC()])
```

### 5. Defensive coding — Handle lỗi gracefully

```typescript
// Luôn có fallback khi DB query thất bại
const goals = goalsData ?? []  // ?? = nếu null/undefined thì dùng []
const score = todayScore?.score ?? null  // ?. = optional chaining
```

### 6. Separation of concerns

```
Server Component  → Fetch data, không tương tác
Client Component  → Tương tác, không fetch (dùng data từ props)
API Route         → Logic phức tạp, external APIs
lib/              → Utilities thuần, không có UI
```

---

## Bước tiếp theo để học sâu hơn

1. **Đọc một feature end-to-end**: Chọn `/habits`, đọc `habits/page.tsx` → `habits-today.tsx` → hiểu luồng server→client
2. **Thêm một field mới**: Thêm `color` vào bảng `habits`, cập nhật UI → học được migration + schema + component update
3. **Viết một API route mới**: Tạo `/api/stats/summary` trả về thống kê tổng hợp → học được API design
4. **Debug một lỗi thật**: Khi có lỗi, đọc error message → tìm file → hiểu context → fix → kiến thức đọng lại lâu nhất
5. **Đọc Next.js docs**: `nextjs.org/docs` — đặc biệt phần App Router và Server Components
