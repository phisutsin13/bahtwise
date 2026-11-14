# Bahtwise

> ทุกบาทมีเรื่องเล่า · Your money, in focus.

แอปติดตามรายรับ–รายจ่ายส่วนตัวแบบสองภาษา (ไทย/อังกฤษ) ดีไซน์เรียบ สงบ และเป็นส่วนตัว
สร้างด้วย Next.js App Router + Supabase เก็บเงินเป็น **จำนวนเต็มสตางค์** ทั้งระบบ (ไม่ใช้ทศนิยม)

## ฟีเจอร์

- **โหมด Demo** — ใช้งานได้ทันทีโดยไม่ต้องตั้งค่าใด ๆ ข้อมูลเก็บใน `localStorage` (สร้างข้อมูลตัวอย่างย้อนหลัง 1 ปี)
- **โหมด Supabase** — ต่อฐานข้อมูลจริง ป้องกันข้อมูลด้วย Row Level Security ทุกตาราง
- **หน้าแรก (Home)** — รายการธุรกรรม, ตัวกรองตามประเภท/หมวด/ช่วงวันที่/คำค้น, เพิ่ม–แก้–ลบ (มี undo)
- **สรุป (Summary)** — แท่ง/โดนัท/สปาร์กไลน์, เทียบช่วงก่อนหน้า, อัตราการออม, ประมาณการรายจ่ายสิ้นเดือน
- **งบประมาณ (Budgets)** — งบรายหมวดต่อเดือน พร้อมแถบความคืบหน้า
- **ตั้งค่า (Settings)** — โปรไฟล์, หมวดหมู่กำหนดเอง, ธีมสว่าง/มืด, ซ่อนยอดเงิน, ส่งออก CSV/JSON
- **สองภาษา + ธีม** — สลับไทย/อังกฤษ และ light/dark/system ได้
- **PWA พื้นฐาน** — manifest + ไอคอนสำหรับติดตั้งบนมือถือ

## สแตก

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19
- [Supabase](https://supabase.com) (`@supabase/ssr`, `@supabase/supabase-js`)
- Tailwind CSS v4, [motion](https://motion.dev), [lucide-react](https://lucide.dev)
- Vitest + Testing Library + PGlite (ทดสอบ RLS ด้วย Postgres จำลอง)

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — แอปจะเริ่มใน **โหมด Demo** ให้อัตโนมัติเมื่อยังไม่ตั้งค่า Supabase

### ต่อ Supabase (ไม่บังคับ)

1. สร้างโปรเจกต์ Supabase แล้วรัน SQL ใน `supabase/migrations/*.sql` (หรือ `supabase db push`)
2. ใน Supabase → Authentication → URL Configuration เพิ่ม Redirect URL: `http://localhost:3000/auth/callback`
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า:

   | ตัวแปร | ใช้ทำอะไร |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL ของโปรเจกต์ |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (ฝั่งเบราว์เซอร์) |
   | `SUPABASE_SERVICE_ROLE_KEY` | เฉพาะฝั่งเซิร์ฟเวอร์ ใช้แปลง username → email ตอนล็อกอิน (ห้ามเปิดเผย) |

   ถ้าเว้นว่างไว้ แอปจะยังทำงานในโหมด Demo ตามปกติ

## คำสั่ง

| คำสั่ง | ทำอะไร |
| --- | --- |
| `npm run dev` | เปิด dev server |
| `npm run build` | build production |
| `npm start` | รัน production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | รันเทสต์ทั้งหมด (Vitest) |
| `npm run test:watch` | เทสต์แบบ watch |
| `npm run check` | lint + typecheck + test รวดเดียว |

## โครงสร้างโปรเจกต์

```
src/
  app/            เส้นทาง (App Router): (app)/home, summary, budgets, settings + auth
  components/     UI แยกตามโดเมน (auth, home, summary, budgets, settings, transactions, ui)
  providers/      React Context: auth, finance, locale, theme, toast, current-date
  lib/            repository (demo/supabase), analytics, money, date, filters, export, types
  i18n/           พจนานุกรม ไทย/อังกฤษ
supabase/
  migrations/     schema + RLS + หมวดหมู่เริ่มต้น
tests/            ชุดเทสต์ Vitest
```

## ความปลอดภัยและข้อมูล

- เงินเก็บเป็น **สตางค์จำนวนเต็ม** (`amountSatang`) ตลอด — ไม่มีทศนิยมในฐานข้อมูลหรือโค้ด
- Supabase เปิด RLS ทุกตารางด้วย `user_id = auth.uid()`; หมวดหมู่ built-in เป็นแถวส่วนกลาง (`user_id is null`)
- ตัว logger ของ dev จะ `sanitize` ลบอีเมล/UUID/ชื่อ/ยอดเงินก่อนเขียน log
- โหมด Demo เก็บข้อมูลในเครื่องเท่านั้น ไม่มีการส่งออกไปภายนอก

## การทดสอบ

```bash
npm test
```

ครอบคลุม: การคำนวณเงิน, analytics/สรุป, ตัวกรอง, logger, การแยกข้อมูล demo และ RLS (ผ่าน PGlite)
