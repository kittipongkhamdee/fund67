/* ============================================================
   Data loader — fetches from Supabase and initializes FM
   ============================================================ */

async function initializeFromSupabase() {
  try {
    const ACADEMIC_YEAR_ID = "2568"; // ปีการศึกษา 2568
    const MONTHLY_FEE = 100;

    // Fetch all required data from Supabase
    const [students, rawMonths, accounts, ledger, queue, settings] = await Promise.all([
      API.fetchStudents(),
      API.fetchMonthPeriods(),
      API.fetchAccounts(),
      API.fetchLedger(null, 50),
      API.fetchVerificationQueue(),
      API.fetchSettings(),
    ]);

    // Normalize month field names (Supabase → app shorthand)
    const months = rawMonths.map((m) => ({
      ...m,
      short: m.month_short,
      full: m.month_full,
      key: m.month_key,
    }));

    // Find current month: prefer is_current flag, else default to index 7 (ม.ค.)
    const currentFlagIdx = months.findIndex((m) => m.is_current);
    const currentMonthIndex = currentFlagIdx >= 0 ? currentFlagIdx : Math.min(7, months.length - 1);
    const thisMonth = months[currentMonthIndex] || { short: "-", full: "-", key: "-", month_short: "-", month_full: "-", month_key: "-" };

    // Helper to build payment status array for a student
    const buildPaymentStatus = async (studentId) => {
      const payments = await API.fetchPayments(studentId);
      return months.map((m) => {
        const payment = payments.find((p) => p.month_periods?.month_key === m.month_key);
        if (!payment) {
          // Determine if month is in future or past
          const monthIndex = months.findIndex((x) => x.month_key === m.month_key);
          return monthIndex > currentMonthIndex ? "future" : "unpaid";
        }
        return payment.status; // "paid", "pending", or "unpaid"
      });
    };

    // Enrich students with payment status
    const enrichedStudents = await Promise.all(
      students.map(async (s) => ({
        ...s,
        pays: await buildPaymentStatus(s.id),
        avatarHue: s.avatar_hue || (parseInt(s.id.slice(-2)) * 13) % 360,
      }))
    );

    // Find logged-in user (from localStorage or default)
    let me = enrichedStudents[0];
    const storedStudentId = localStorage.getItem("loggedInStudentId");
    if (storedStudentId) {
      const found = enrichedStudents.find((s) => s.id === storedStudentId);
      if (found) me = found;
    }

    // Helper to count payments by status
    const countFor = (monthIndex) => {
      let paid = 0,
        pending = 0,
        unpaid = 0;
      enrichedStudents.forEach((s) => {
        const st = s.pays[monthIndex];
        if (st === "paid") paid++;
        else if (st === "pending") pending++;
        else if (st === "unpaid") unpaid++;
      });
      return { paid, pending, unpaid, total: enrichedStudents.length };
    };

    // Calculate monthly collected amounts
    const monthlyCollected = months.map((m, mi) => {
      if (mi > currentMonthIndex) return null;
      return countFor(mi).paid * MONTHLY_FEE;
    });

    // Format functions
    const fmt = (n) => (n < 0 ? "-" : "") + "฿" + Math.abs(n).toLocaleString("th-TH");
    const fmtNum = (n) => Math.abs(n).toLocaleString("th-TH");

    // Normalize account field names (Supabase → app shorthand)
    const normalizedAccounts = accounts.map((a) => ({
      ...a,
      number: a.account_number,
      holder: a.holder_name,
      bankName: a.bank_name,
      bankCode: a.bank_code,
      bankColor: a.bank_color,
      active: a.status === "active",
    }));

    // Calculate totals from accounts
    const totals = {
      received: normalizedAccounts.reduce((a, acc) => a + (acc.received || 0), 0),
      withdrawn: normalizedAccounts.reduce((a, acc) => a + (acc.withdrawn || 0), 0),
      balance: normalizedAccounts.reduce((a, acc) => a + (acc.balance || 0), 0),
      reserved: 1200,
    };
    totals.available = totals.balance - totals.reserved;

    // Initialize FM object
    window.FM = {
      MONTHLY_FEE,
      months,
      currentMonthIndex,
      students: enrichedStudents,
      me,
      accounts: normalizedAccounts,
      totals,
      ledger: ledger || [],
      queue: queue || [],
      countFor,
      monthlyCollected,
      thisMonth,
      fmt,
      fmtNum,
      settings: settings || {},
      isLoading: false,
      lastUpdated: new Date().toISOString(),
    };

    // Set up real-time subscriptions if page is open long-term
    if (window.setUpRealtimeSubscriptions) {
      window.setUpRealtimeSubscriptions();
    }

    console.log("✓ FM initialized from Supabase", window.FM);
    if (window.__startApp) window.__startApp();
    return window.FM;
  } catch (error) {
    console.error("Failed to initialize FM from Supabase:", error);
    // Fall back to demo data (data.js will handle it)
    throw error;
  }
}

function showLoadError(err) {
  const el = document.getElementById("app-loading");
  if (el) el.innerHTML = `
    <div style="text-align:center;font-family:'Anuphan',system-ui,sans-serif;padding:32px;max-width:360px">
      <div style="font-size:32px;margin-bottom:12px">⚠️</div>
      <div style="font-size:17px;font-weight:700;color:#16181D;margin-bottom:8px">โหลดข้อมูลไม่สำเร็จ</div>
      <div style="font-size:14px;color:#54565E;margin-bottom:20px">ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่</div>
      <div style="font-size:12px;color:#8A8C93;background:#F4F3EF;padding:8px 12px;border-radius:8px;margin-bottom:20px;word-break:break-all">${err?.message || err}</div>
      <button onclick="location.reload()" style="background:#0B5FFF;color:#fff;border:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">โหลดใหม่</button>
    </div>`;
}

// Initialize when Supabase client is ready
if (window.supabase) {
  initializeFromSupabase().catch((err) => {
    console.error("FM initialization failed:", err);
    showLoadError(err);
  });
} else {
  showLoadError("Supabase client not loaded");
}

Object.assign(window, { initializeFromSupabase });
