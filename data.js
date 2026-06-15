/* ============================================================
   Demo fallback data — only used if Supabase loading fails.
   This data is loaded after data-loader.js, so it only initializes
   FM if it hasn't been set already by Supabase.
   ============================================================ */
(function () {
  // Skip if FM was already initialized from Supabase
  if (window.FM && window.FM.students && window.FM.students.length > 0) {
    console.log("✓ Using Supabase data");
    return;
  }
  console.log("⚠ Using demo data (Supabase not available)");
  // --- tiny seeded RNG so data is stable across re-renders ---
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20262);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const firstNames = [
    "กันต์", "ณัฐ", "ปวีณ์", "ธนกร", "ศุภวิชญ์", "ภาคิน", "ชยพล", "ปุณยวีร์",
    "อนันดา", "วรินทร", "ภูริ", "ธีร์", "กฤตเมธ", "พชร", "สิรวิชญ์", "นภัส",
    "ปาณิสรา", "ณิชา", "พิมพ์มาดา", "อาทิตยา", "เบญญาภา", "ชนัญชิดา", "กัญญาณัฐ",
    "ธัญชนก", "ปริยากร", "วรัญญา", "อภิสรา", "ศิรประภา", "มนัสนันท์", "ฐิติชญา",
  ];
  const lastNames = [
    "ศรีสุข", "ทองดี", "วงศ์ไทย", "พัฒนกุล", "ใจดี", "รัตนพร", "สมบูรณ์", "บุญมี",
    "ชัยวัฒน์", "ธรรมรงค์", "อินทร์ทอง", "เกียรติศักดิ์", "พงษ์เพชร", "มั่นคง",
    "ภักดี", "สุขเกษม", "วัฒนชัย", "ดำรงเดช", "อภิวงศ์", "เจริญสุข",
  ];

  const MONTHLY_FEE = 100;
  // ปีการศึกษา 2568 — มิ.ย.68 ถึง พ.ค.69
  const months = [
    { key: "06-68", short: "มิ.ย.", full: "มิถุนายน 2568" },
    { key: "07-68", short: "ก.ค.", full: "กรกฎาคม 2568" },
    { key: "08-68", short: "ส.ค.", full: "สิงหาคม 2568" },
    { key: "09-68", short: "ก.ย.", full: "กันยายน 2568" },
    { key: "10-68", short: "ต.ค.", full: "ตุลาคม 2568" },
    { key: "11-68", short: "พ.ย.", full: "พฤศจิกายน 2568" },
    { key: "12-68", short: "ธ.ค.", full: "ธันวาคม 2568" },
    { key: "01-69", short: "ม.ค.", full: "มกราคม 2569" },
    { key: "02-69", short: "ก.พ.", full: "กุมภาพันธ์ 2569" },
    { key: "03-69", short: "มี.ค.", full: "มีนาคม 2569" },
    { key: "04-69", short: "เม.ย.", full: "เมษายน 2569" },
    { key: "05-69", short: "พ.ค.", full: "พฤษภาคม 2569" },
  ];
  const currentMonthIndex = 7; // ม.ค.69 = เดือนปัจจุบันที่กำลังเก็บ

  // --- generate students, sorted by student id ascending ---
  const N = 28;
  const students = [];
  for (let i = 0; i < N; i++) {
    const sid = "67104050" + String(i + 1).padStart(2, "0"); // 6710405001 ..
    const fn = firstNames[i % firstNames.length];
    const ln = pick(lastNames);
    // payment status per month
    const reliability = 0.6 + rnd() * 0.4; // how diligent this student is
    const pays = months.map((m, mi) => {
      if (mi > currentMonthIndex) return "future";
      if (mi === currentMonthIndex) {
        const r = rnd();
        if (r < reliability - 0.15) return "paid";
        if (r < reliability + 0.05) return "pending"; // อัปสลิปแล้ว รอตรวจ
        return "unpaid";
      }
      // past months
      return rnd() < reliability + 0.18 ? "paid" : (rnd() < 0.5 ? "unpaid" : "paid");
    });
    students.push({
      id: sid,
      name: fn + " " + ln,
      nick: fn,
      avatarHue: Math.floor(rnd() * 360),
      pays,
    });
  }
  // make student #4 the "logged-in" demo student with a clean-ish record
  const me = students[3];
  me.name = "ปวีณ์ พัฒนกุล";
  me.nick = "ปวีณ์";
  me.isMe = true;
  me.pays = me.pays.map((p, i) =>
    i < currentMonthIndex ? "paid" : i === currentMonthIndex ? "unpaid" : "future"
  );

  // --- helpers ---
  const countFor = (mi) => {
    let paid = 0, pending = 0, unpaid = 0;
    students.forEach((s) => {
      const st = s.pays[mi];
      if (st === "paid") paid++;
      else if (st === "pending") pending++;
      else if (st === "unpaid") unpaid++;
    });
    return { paid, pending, unpaid, total: students.length };
  };
  const monthlyCollected = months.map((m, mi) =>
    mi > currentMonthIndex ? null : countFor(mi).paid * MONTHLY_FEE
  );

  // --- accounts (บัญชีกลาง — ล่าสุด + เก่า) ---
  const accounts = [
    {
      id: "scb-current",
      label: "บัญชีกองทุนปัจจุบัน",
      bankName: "ไทยพาณิชย์",
      bankCode: "SCB",
      bankColor: "#4E2A84",
      number: "123-4-56789-0",
      promptpay: "098-765-4321",
      holder: "น.ส. ปาณิสรา รัตนพร (เหรัญญิก)",
      status: "active",
      received: 18200,
      withdrawn: 5450,
      balance: 12750,
    },
    {
      id: "kbank-old",
      label: "บัญชีกองทุนเดิม (ปิดรับแล้ว)",
      bankName: "กสิกรไทย",
      bankCode: "KBANK",
      bankColor: "#0F9D58",
      number: "078-2-11122-5",
      promptpay: "—",
      holder: "นาย ธนกร ใจดี (อดีตเหรัญญิก)",
      status: "archived",
      received: 6500,
      withdrawn: 3000,
      balance: 3500,
    },
  ];

  const totals = {
    received: accounts.reduce((a, b) => a + b.received, 0),     // ยอดเงินทั้งหมด
    withdrawn: accounts.reduce((a, b) => a + b.withdrawn, 0),   // ถอน
    balance: accounts.reduce((a, b) => a + b.balance, 0),       // คงเหลือ
    reserved: 1200,                                             // กันไว้ (รายการค้างจ่าย)
  };
  totals.available = totals.balance - totals.reserved;          // คงเหลือที่ใช้ได้

  // --- recent activity / ledger ---
  const ledger = [
    { id: "tx1", type: "in", title: "ค่ากองทุน ม.ค. — ณัฐ ศรีสุข", sub: "6710405002 · พร้อมเพย์", amount: 100, when: "วันนี้ 09:14", account: "SCB", verified: true },
    { id: "tx2", type: "in", title: "ค่ากองทุน ม.ค. — กันต์ ทองดี", sub: "6710405001 · พร้อมเพย์", amount: 100, when: "วันนี้ 08:50", account: "SCB", verified: true },
    { id: "tx3", type: "out", title: "ค่าเสื้อรุ่น (มัดจำ)", sub: "โอนให้ร้านสกรีน", amount: -2400, when: "เมื่อวาน 16:20", account: "SCB", verified: true },
    { id: "tx4", type: "in", title: "ค่ากองทุน ม.ค. — ภาคิน ใจดี", sub: "6710405006 · พร้อมเพย์", amount: 100, when: "เมื่อวาน 13:02", account: "SCB", verified: true },
    { id: "tx5", type: "out", title: "ค่าดอกไม้งานรับปริญญา", sub: "ร้านดอกไม้", amount: -850, when: "10 ม.ค. 11:30", account: "SCB", verified: true },
    { id: "tx6", type: "in", title: "ค่ากองทุน ธ.ค. (ย้อนหลัง) — วรินทร", sub: "6710405010 · เงินสด", amount: 100, when: "9 ม.ค. 15:45", account: "SCB", verified: true },
  ];

  // --- AI verification queue (สลิปรอตรวจ) ---
  const queue = [
    {
      id: "q1", student: "อาทิตยา เจริญสุข", sid: "6710405020", month: "ม.ค. 2569",
      uploaded: "09:02 วันนี้",
      ai: { amount: 100, date: "13 ม.ค. 2569", time: "08:59", bank: "SCB", ref: "0151xxxx8821",
            toAccount: "123-4-56789-0", confidence: 0.98, status: "match" },
    },
    {
      id: "q2", student: "สิรวิชญ์ มั่นคง", sid: "6710405015", month: "ม.ค. 2569",
      uploaded: "08:41 วันนี้",
      ai: { amount: 100, date: "13 ม.ค. 2569", time: "08:38", bank: "KBANK", ref: "X23kk1190",
            toAccount: "123-4-56789-0", confidence: 0.93, status: "match" },
    },
    {
      id: "q3", student: "เบญญาภา ภักดี", sid: "6710405021", month: "ม.ค. 2569",
      uploaded: "เมื่อวาน 22:10",
      ai: { amount: 50, date: "12 ม.ค. 2569", time: "22:05", bank: "BBL", ref: "p88210031",
            toAccount: "123-4-56789-0", confidence: 0.71, status: "amount_mismatch",
            note: "ยอดโอน ฿50 ไม่ตรงกับค่ากองทุน ฿100" },
    },
    {
      id: "q4", student: "ฐิติชญา อภิวงศ์", sid: "6710405028", month: "ม.ค. 2569",
      uploaded: "เมื่อวาน 20:30",
      ai: { amount: 100, date: "8 พ.ย. 2568", time: "19:00", bank: "SCB", ref: "0151xxxx2210",
            toAccount: "123-4-56789-0", confidence: 0.40, status: "duplicate",
            note: "ตรวจพบสลิปนี้เคยถูกใช้ยืนยันเดือน พ.ย. มาแล้ว (ภาพซ้ำ)" },
    },
  ];

  window.FM = {
    MONTHLY_FEE, months, currentMonthIndex, students, me,
    accounts, totals, ledger, queue,
    countFor, monthlyCollected,
    thisMonth: months[currentMonthIndex],
    fmt: (n) => (n < 0 ? "-" : "") + "฿" + Math.abs(n).toLocaleString("th-TH"),
    fmtNum: (n) => Math.abs(n).toLocaleString("th-TH"),
  };
})();
