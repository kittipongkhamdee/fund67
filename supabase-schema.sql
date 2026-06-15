-- ============================================================
-- กองทุนรุ่น · Financial Management — Supabase Database Schema
-- วาง SQL นี้ใน Supabase > SQL Editor แล้วกด Run
-- ============================================================

-- ── 1. นักศึกษา ──────────────────────────────────────────────
CREATE TABLE students (
  id          TEXT PRIMARY KEY,           -- รหัสนักศึกษา '6710405001'
  name        TEXT NOT NULL,
  class_id    TEXT DEFAULT 'IT-A',
  avatar_hue  INTEGER DEFAULT 220,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. ปีการศึกษา ─────────────────────────────────────────────
CREATE TABLE academic_years (
  id           SERIAL PRIMARY KEY,
  year_label   TEXT NOT NULL,             -- '2568'
  monthly_fee  INTEGER NOT NULL DEFAULT 100
);

-- ── 3. เดือนในปีการศึกษา ───────────────────────────────────────
CREATE TABLE month_periods (
  id                SERIAL PRIMARY KEY,
  academic_year_id  INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
  month_key         TEXT NOT NULL,        -- '06-68'
  month_short       TEXT NOT NULL,        -- 'มิ.ย.'
  month_full        TEXT NOT NULL,        -- 'มิถุนายน 2568'
  period_index      INTEGER NOT NULL,     -- 0–11
  is_current        BOOLEAN DEFAULT FALSE
);

-- ── 4. การชำระเงิน ────────────────────────────────────────────
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            TEXT NOT NULL REFERENCES students(id),
  month_period_id       INTEGER NOT NULL REFERENCES month_periods(id),
  status                TEXT CHECK (status IN ('paid','pending','unpaid')) DEFAULT 'unpaid',
  amount                INTEGER NOT NULL,
  slip_url              TEXT,             -- Supabase Storage path
  ai_verified           BOOLEAN DEFAULT FALSE,
  ai_confidence         REAL,
  ai_result             JSONB,            -- {amount, date, time, bank, ref, toAccount, status}
  admin_confirmed_by    TEXT,             -- admin user id
  admin_confirmed_at    TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, month_period_id)   -- จ่ายได้ 1 ครั้ง/เดือน
);

-- ── 5. บัญชีธนาคาร ────────────────────────────────────────────
CREATE TABLE bank_accounts (
  id              SERIAL PRIMARY KEY,
  bank_name       TEXT NOT NULL,          -- 'ไทยพาณิชย์'
  bank_code       TEXT NOT NULL,          -- 'SCB'
  account_number  TEXT NOT NULL,          -- '123-4-56789-0'
  promptpay       TEXT,
  holder_name     TEXT NOT NULL,
  status          TEXT CHECK (status IN ('active','archived')) DEFAULT 'active',
  bank_color      TEXT DEFAULT '#4E2A84',
  received        INTEGER DEFAULT 0,      -- ยอดรับรวม (อัปเดตด้วย trigger)
  withdrawn       INTEGER DEFAULT 0,      -- ยอดถอนรวม
  balance         INTEGER GENERATED ALWAYS AS (received - withdrawn) STORED
);

-- ── 6. รายการเดินบัญชี ────────────────────────────────────────
CREATE TABLE transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   INTEGER REFERENCES bank_accounts(id),
  type         TEXT CHECK (type IN ('in','out')),
  amount       INTEGER NOT NULL,
  description  TEXT,
  payment_id   UUID REFERENCES payments(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. ผู้ดูแลระบบ ────────────────────────────────────────────
-- ใช้ Supabase Auth ร่วมกับตารางนี้
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  display_id  TEXT UNIQUE NOT NULL,       -- admin username/ID ที่แสดง
  name        TEXT,
  role        TEXT DEFAULT 'treasurer',   -- treasurer | super_admin
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. Row Level Security ─────────────────────────────────────
ALTER TABLE students        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_periods   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;

-- นักศึกษา: อ่านข้อมูลตัวเองได้เท่านั้น (ใช้ anon key + student_id stored in JWT custom claims)
-- Admin: อ่าน-เขียนได้ทุก row (ผ่าน Supabase Auth role)

-- ── 9. Indexes ────────────────────────────────────────────────
CREATE INDEX idx_payments_student    ON payments(student_id);
CREATE INDEX idx_payments_month      ON payments(month_period_id);
CREATE INDEX idx_payments_status     ON payments(status);
CREATE INDEX idx_transactions_acct   ON transactions(account_id);

-- ── 10. ข้อมูลเริ่มต้น ───────────────────────────────────────
INSERT INTO academic_years (year_label, monthly_fee) VALUES ('2568', 100);

INSERT INTO month_periods (academic_year_id, month_key, month_short, month_full, period_index, is_current)
VALUES
  (1,'06-68','มิ.ย.','มิถุนายน 2568',0,false),
  (1,'07-68','ก.ค.','กรกฎาคม 2568',1,false),
  (1,'08-68','ส.ค.','สิงหาคม 2568',2,false),
  (1,'09-68','ก.ย.','กันยายน 2568',3,false),
  (1,'10-68','ต.ค.','ตุลาคม 2568',4,false),
  (1,'11-68','พ.ย.','พฤศจิกายน 2568',5,false),
  (1,'12-68','ธ.ค.','ธันวาคม 2568',6,false),
  (1,'01-69','ม.ค.','มกราคม 2569',7,true),   -- เดือนปัจจุบัน
  (1,'02-69','ก.พ.','กุมภาพันธ์ 2569',8,false),
  (1,'03-69','มี.ค.','มีนาคม 2569',9,false),
  (1,'04-69','เม.ย.','เมษายน 2569',10,false),
  (1,'05-69','พ.ค.','พฤษภาคม 2569',11,false);

INSERT INTO bank_accounts (bank_name, bank_code, account_number, promptpay, holder_name, status, bank_color)
VALUES
  ('ไทยพาณิชย์','SCB','123-4-56789-0','098-765-4321','น.ส. ปาณิสรา รัตนพร (เหรัญญิก)','active','#4E2A84'),
  ('กสิกรไทย','KBANK','078-2-11122-5',NULL,'นาย ธนกร ใจดี (อดีตเหรัญญิก)','archived','#0F9D58');

-- ── 11. Migration: ลบ nick column ───────────────────────────
-- รันใน Supabase SQL Editor ถ้า table students มีอยู่แล้ว
-- ALTER TABLE students DROP COLUMN IF EXISTS nick;

-- ── 12. Storage Bucket สำหรับสลิป ────────────────────────────
-- ทำใน Supabase Dashboard > Storage > New Bucket
-- Bucket name: "slips"  |  Public: false  |  File size limit: 5MB
-- Allowed MIME: image/jpeg, image/png, image/webp
