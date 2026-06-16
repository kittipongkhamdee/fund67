-- ============================================================
-- Supabase Storage — Slip Images Setup
-- วาง SQL นี้ใน Supabase > SQL Editor แล้วกด Run
-- ============================================================

-- ── 1. สร้าง bucket "slips" (public) ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'slips',
  'slips',
  true,
  10485760,  -- 10 MB limit per file
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic'];

-- ── 2. RLS Policies สำหรับ Storage ─────────────────────────

-- ให้ anon (นักศึกษา) อัปโหลดสลิปได้
CREATE POLICY "allow anon upload slips"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'slips');

-- ให้ทุกคนดูรูปสลิปได้ (public bucket)
CREATE POLICY "allow public read slips"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'slips');

-- ── 3. RLS Policies สำหรับ payments table ──────────────────
-- (รัน เฉพาะถ้ายังไม่มี policy เหล่านี้)

-- ให้ anon อ่านข้อมูล payments ได้
CREATE POLICY "allow anon read payments"
ON payments
FOR SELECT
TO anon
USING (true);

-- ให้ anon สร้าง payment (ส่งสลิป) ได้
CREATE POLICY "allow anon insert payments"
ON payments
FOR INSERT
TO anon
WITH CHECK (true);

-- ให้ anon อัปเดต payment ได้ (admin ยืนยัน/ปฏิเสธ)
CREATE POLICY "allow anon update payments"
ON payments
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
