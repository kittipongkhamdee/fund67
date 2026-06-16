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

  async createStudent(studentData) {
    const { data, error } = await supabase
      .from("students")
      .insert([studentData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateStudent(studentId, updates) {
    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", studentId)
      .select();
    if (error) throw error;
    return data[0];
  },

  async deleteStudent(studentId) {
    const { data, error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);
    if (error) throw error;
    return true;
  },

  // --- Month Periods ---
  async fetchMonthPeriods() {
    const { data, error } = await supabase
      .from("month_periods")
      .select("*")
      .order("period_index", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // --- Payments ---
  async fetchPayments(studentId) {
    const { data, error } = await supabase
      .from("payments")
      .select("*, month_periods(month_key, month_full)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async fetchAllPayments(filters = {}) {
    let query = supabase.from("payments").select("*, students(id, name), month_periods(month_key, month_full)");

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
  async uploadSlipToStorage(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from("slips").upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("slips").getPublicUrl(data.path);
    return urlData.publicUrl;
  },

  async createPendingPayment(studentId, monthPeriodId, amount, slipUrl) {
    const { data, error } = await supabase
      .from("payments")
      .insert([{ student_id: studentId, month_period_id: monthPeriodId, amount, status: "pending", slip_image_url: slipUrl, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data[0];
  },

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

  async fetchVerificationQueue() {
    const { data, error } = await supabase
      .from("payments")
      .select("*, students(id, name), month_periods(month_full)")
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
  async fetchAccounts() {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("status", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createAccount(data) {
    const { data: d, error } = await supabase.from("bank_accounts").insert([data]).select();
    if (error) throw error;
    return d[0];
  },

  async updateAccount(id, updates) {
    const { data: d, error } = await supabase.from("bank_accounts").update(updates).eq("id", id).select();
    if (error) throw error;
    return d[0];
  },

  async deleteAccount(id) {
    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- Transactions / Ledger ---
  async fetchLedger(accountId, limit = 20) {
    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (accountId != null) query = query.eq("account_id", accountId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async fetchAllTransactions(limit = 100) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
    return true;
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

  // --- App Settings ---
  async fetchSettings() {
    const { data, error } = await supabase.from("app_settings").select("*");
    if (error) throw error;
    return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  },

  async updateSetting(key, value) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value });
    if (error) throw error;
  },

  async notifyAdmin(title, body) {
    const topic = FM.settings?.notify_topic;
    if (!topic) return;
    const res = await fetch("https://ntfy.sh/" + encodeURIComponent(topic), {
      method: "POST",
      headers: { "Title": title, "Priority": "default", "Tags": "bell" },
      body,
    });
    if (!res.ok) throw new Error("ntfy status " + res.status);
  },
};

Object.assign(window, { API });
