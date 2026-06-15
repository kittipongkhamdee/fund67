/* ============================================================
   API wrapper for Supabase database operations
   Real-time updates enabled for payments and verification queue
   ============================================================ */

const API = {
  // --- Students ---
  async fetchStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async fetchStudentById(studentId) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();
    if (error) throw error;
    return data;
  },

  // --- Month Periods ---
  async fetchMonthPeriods(academicYearId) {
    const { data, error } = await supabase
      .from("month_periods")
      .select("*")
      .eq("academic_year_id", academicYearId)
      .order("month_number", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // --- Payments ---
  async fetchPayments(studentId) {
    const { data, error } = await supabase
      .from("payments")
      .select("*, month_periods(month_key, full_month_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async fetchAllPayments(filters = {}) {
    let query = supabase.from("payments").select("*, students(id, name, nick), month_periods(month_key, full_month_name)");

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.monthPeriodId) {
      query = query.eq("month_period_id", filters.monthPeriodId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async submitPayment(studentId, monthPeriodId, amount, bankCode, reference) {
    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          student_id: studentId,
          month_period_id: monthPeriodId,
          amount,
          bank_code: bankCode,
          reference_number: reference,
          status: "pending", // awaiting slip verification
          slip_image_url: null,
          ai_result: null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  // --- Slips & Verification Queue ---
  async uploadSlip(paymentId, imageUrl, aiResult) {
    const { data, error } = await supabase
      .from("payments")
      .update({
        slip_image_url: imageUrl,
        ai_result: aiResult,
        status: "pending",
      })
      .eq("id", paymentId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async fetchVerificationQueue(academicYearId) {
    const { data, error } = await supabase
      .from("payments")
      .select("*, students(id, name, nick), month_periods(full_month_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async confirmPayment(paymentId, verified = true) {
    const { data, error } = await supabase
      .from("payments")
      .update({
        status: verified ? "paid" : "rejected",
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select();
    if (error) throw error;
    return data[0];
  },

  // --- Bank Accounts ---
  async fetchAccounts(academicYearId) {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("academic_year_id", academicYearId)
      .order("is_active", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // --- Transactions / Ledger ---
  async fetchLedger(accountId, limit = 20) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async recordTransaction(accountId, type, title, amount, description) {
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          account_id: accountId,
          type,
          title,
          amount,
          description,
          created_at: new Date().toISOString(),
        },
      ])
      .select();
    if (error) throw error;
    return data[0];
  },

  // --- Aggregates ---
  async fetchMonthlyStats(academicYearId) {
    const { data, error } = await supabase
      .rpc("get_monthly_stats", { p_academic_year_id: academicYearId });
    if (error) throw error;
    return data || [];
  },

  async fetchDashboardStats(academicYearId) {
    const { data, error } = await supabase
      .rpc("get_dashboard_stats", { p_academic_year_id: academicYearId });
    if (error) throw error;
    return data || {};
  },

  // --- Real-time Subscriptions ---
  subscribeToPayments(studentId, callback) {
    return supabase
      .from(`payments:student_id=eq.${studentId}`)
      .on("*", (payload) => {
        callback(payload);
      })
      .subscribe();
  },

  subscribeToVerificationQueue(callback) {
    return supabase
      .from("payments:status=eq.pending")
      .on("*", (payload) => {
        callback(payload);
      })
      .subscribe();
  },

  subscribeToAccountBalance(accountId, callback) {
    return supabase
      .from(`bank_accounts:id=eq.${accountId}`)
      .on("UPDATE", (payload) => {
        callback(payload.new);
      })
      .subscribe();
  },

  unsubscribe(subscription) {
    return supabase.removeSubscription(subscription);
  },
};

Object.assign(window, { API });
