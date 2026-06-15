/* ============================================================
   Data loader — fetches from Supabase and initializes FM
   ============================================================ */

async function initializeFromSupabase() {
  try {
    const ACADEMIC_YEAR_ID = "2568"; // ปีการศึกษา 2568
    const MONTHLY_FEE = 100;

    // Fetch all required data from Supabase
    const [students, months, accounts, ledger, queue] = await Promise.all([
      API.fetchStudents(),
      API.fetchMonthPeriods(ACADEMIC_YEAR_ID),
      API.fetchAccounts(ACADEMIC_YEAR_ID),
      API.fetchLedger(null, 50), // will filter by account in component
      API.fetchVerificationQueue(ACADEMIC_YEAR_ID),
    ]);

    // Find current month (latest month or default to index 7 = ม.ค.)
    const currentMonthIndex = Math.min(7, months.length - 1);
    const thisMonth = months[currentMonthIndex];

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
        nick: s.name.split(" ")[0], // First word as nick
        avatarHue: (parseInt(s.id.slice(-2)) * 13) % 360, // Deterministic hue from ID
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

    // Calculate totals from accounts
    const totals = {
      received: accounts.reduce((a, acc) => a + (acc.received || 0), 0),
      withdrawn: accounts.reduce((a, acc) => a + (acc.withdrawn || 0), 0),
      balance: accounts.reduce((a, acc) => a + (acc.balance || 0), 0),
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
      accounts,
      totals,
      ledger: ledger || [],
      queue: queue || [],
      countFor,
      monthlyCollected,
      thisMonth,
      fmt,
      fmtNum,
      isLoading: false,
      lastUpdated: new Date().toISOString(),
    };

    // Set up real-time subscriptions if page is open long-term
    if (window.setUpRealtimeSubscriptions) {
      window.setUpRealtimeSubscriptions();
    }

    console.log("✓ FM initialized from Supabase", window.FM);
    return window.FM;
  } catch (error) {
    console.error("Failed to initialize FM from Supabase:", error);
    // Fall back to demo data if Supabase is unavailable
    console.log("Falling back to demo data...");
    throw error;
  }
}

// Initialize when Supabase client is ready
if (window.supabase) {
  initializeFromSupabase().catch((err) => {
    console.error("FM initialization failed:", err);
    alert("โหลดข้อมูลล้มเหลว กรุณาโหลดหน้าใหม่");
  });
} else {
  console.warn("Supabase client not loaded yet");
}

Object.assign(window, { initializeFromSupabase });
