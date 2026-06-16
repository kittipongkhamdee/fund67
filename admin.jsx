/* ============================================================
   Admin / เหรัญญิก views: balance summary, per-person status,
   AI verification queue.
   ============================================================ */

/* ---------- mini bar chart ---------- */
function BarChart({ data, labels }) {
  const max = Math.max(...data.filter((d) => d != null), 1);
  const mounted = useMounted(150);
  return (
    <div className="barchart-wrap">
    <div className="row" style={{ alignItems: "flex-end", gap: 7, height: 120, marginTop: 4, minWidth: 280 }}>
      {data.map((v, i) => {
        const future = v == null;
        const h = future ? 6 : 14 + (v / max) * 92;
        const cur = i === FM.currentMonthIndex;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div title={future ? "ยังไม่ถึง" : FM.fmt(v)} style={{
              width: "100%", maxWidth: 26, height: mounted ? h : 6,
              background: future ? "var(--mut-bg)" : cur ? "var(--brand)" : "var(--brand-bg)",
              border: future ? "1.5px dashed var(--line2)" : "none",
              borderRadius: 7, transition: "height .8s cubic-bezier(.2,.8,.2,1)", transitionDelay: i * 35 + "ms",
            }} />
            <span className="muted" style={{ fontSize: 10, fontWeight: 600 }}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
    </div>
  );
}

/* ---------- Admin dashboard ---------- */
function AdminDashboard() {
  const [acc, setAcc] = useState("all"); // all | scb-current | kbank-old
  const t = FM.totals;
  const view = acc === "all"
    ? { received: t.received, withdrawn: t.withdrawn, balance: t.balance, available: t.available }
    : (() => { const a = FM.accounts.find((x) => x.id === acc); return { received: a.received || 0, withdrawn: a.withdrawn || 0, balance: a.balance || 0, available: a.balance || 0 }; })();

  const cm = FM.countFor(FM.currentMonthIndex);
  const paidPct = cm.total > 0 ? cm.paid / cm.total : 0;

  const stats = [
    { label: "ยอดเงินทั้งหมด", val: view.received, ic: "trend", bg: "var(--brand-bg)", fg: "var(--brand)", glow: "#0B5FFF", foot: "รับเข้าสะสมทุกบัญชี" },
    { label: "คงเหลือ", val: view.balance, ic: "wallet", bg: "var(--ok-bg)", fg: "var(--ok)", glow: "#0E8F5B", foot: "ยอดในบัญชีปัจจุบัน" },
    { label: "ถอน / ใช้จ่าย", val: view.withdrawn, ic: "arrowUp", bg: "var(--bad-bg)", fg: "var(--bad)", glow: "#D1453B", foot: "รายจ่ายสะสม" },
    { label: "คงเหลือที่ใช้ได้", val: view.available, ic: "shield", bg: "var(--warn-bg)", fg: "var(--warn)", glow: "#B7791F", foot: "ยอดรับ − ยอดเบิกจ่าย" },
  ];

  return (
    <div>
      {/* last updated */}
      <div className="row" style={{ justifyContent: "flex-end", marginBottom: 16 }}>
        <div className="row gap8 muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          <Icon name="refresh" size={15} /> อัปเดตล่าสุด วันนี้ 09:15
        </div>
      </div>

      {/* stat grid */}
      <div className="grid stat-grid">
        {stats.map((s, i) => {
          const v = useCountUp(s.val, [s.val, acc]);
          return (
            <div key={s.label} className="card stat reveal" style={{ animationDelay: i * .06 + "s" }}>
              <div className="stat-glow" style={{ background: s.glow }} />
              <div className="stat-label"><span className="stat-ic" style={{ background: s.bg, color: s.fg }}><Icon name={s.ic} size={17} /></span>{s.label}</div>
              <div className="stat-val num">{FM.fmt(Math.round(v))}</div>
              <div className="stat-foot">{s.foot}</div>
            </div>
          );
        })}
      </div>

      <div className="grid-halves-chart mt16">
        {/* collection chart */}
        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".1s" }}>
          <div className="row between">
            <div>
              <div className="section-title">ยอดเก็บรายเดือน</div>
              <div className="muted" style={{ fontSize: 12.5 }}>ปีการศึกษา 2569 · {FM.fmt(FM.MONTHLY_FEE)}/คน/เดือน</div>
            </div>
            <span className="badge" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}>
              <Icon name="trend" size={14} stroke={2.4} /> {FM.fmt(cm.paid * FM.MONTHLY_FEE)} เดือนนี้
            </span>
          </div>
          <BarChart data={FM.monthlyCollected} labels={FM.months.map((m) => m.short)} />
        </div>

        {/* paid ring */}
        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".16s", textAlign: "center" }}>
          <div className="section-title" style={{ textAlign: "left" }}>การจ่ายเดือน {FM.thisMonth.short}</div>
          <div style={{ display: "grid", placeItems: "center", margin: "10px 0 6px" }}>
            <Ring value={paidPct} size={132} stroke={13} color="var(--ok)">
              <div>
                <div className="num" style={{ fontSize: 27, fontWeight: 700 }}>{Math.round(paidPct * 100)}%</div>
                <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>จ่ายแล้ว</div>
              </div>
            </Ring>
          </div>
          <div className="row" style={{ justifyContent: "center", gap: 16, marginTop: 6 }}>
            {[["จ่าย", cm.paid, "var(--ok)"], ["รอตรวจ", cm.pending, "var(--warn)"], ["ค้าง", cm.unpaid, "var(--bad)"]].map(([l, n, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div className="num" style={{ fontSize: 19, fontWeight: 700, color: c }}>{n}</div>
                <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* accounts + ledger */}
      <div className="grid-halves mt16">
        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".2s" }}>
          <div className="section-title" style={{ marginBottom: 14 }}>บัญชีกองทุน</div>
          <div style={{ display: "grid", gap: 12 }}>
            {FM.accounts.map((a) => (
              <div key={a.id} className="row gap12" style={{ padding: 13, borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--line)" }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: a.bankColor, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{a.bankCode.slice(0, 2)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row gap8" style={{ alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.bankName}</span>
                    {a.status === "archived"
                      ? <span className="badge badge-sm" style={{ background: "var(--mut-bg)", color: "var(--mut)" }}>ปิดรับ</span>
                      : <span className="badge badge-sm" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}>ใช้งาน</span>}
                  </div>
                  <div className="num muted" style={{ fontSize: 12, marginTop: 1 }}>{a.number}</div>
                </div>
                <div className="num" style={{ fontWeight: 700, fontSize: 15 }}>{FM.fmt(FM.totals.balance)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".24s" }}>
          <div className="section-title" style={{ marginBottom: 6 }}>รายการล่าสุด</div>
          <div>
            {FM.ledger.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--mut)" }}>
                <Icon name="receipt" size={28} style={{ opacity: .4 }} />
                <div style={{ fontSize: 13, marginTop: 8 }}>ยังไม่มีรายการ</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>รายการจะปรากฏเมื่อเหรัญญิกยืนยันการชำระ</div>
              </div>
            ) : FM.ledger.slice(0, 8).map((tx) => {
              const isIn = tx.type === "income" || tx.type === "in";
              const typeLabel = isIn ? "รับเข้า" : "ถอน / จ่าย";
              const dt = tx.created_at ? new Date(tx.created_at) : null;
              const dateStr = dt ? dt.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : (tx.when || "");
              const timeStr = dt ? dt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";
              return (
                <div key={tx.id} className="lrow">
                  <span className="lrow-ic" style={{ background: isIn ? "var(--ok-bg)" : "var(--bad-bg)", color: isIn ? "var(--ok)" : "var(--bad)" }}>
                    <Icon name={isIn ? "arrowDown" : "arrowUp"} size={18} stroke={2.4} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.title}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{typeLabel} · {dateStr} เวลา {timeStr}</div>
                  </div>
                  <div className="num" style={{ fontWeight: 700, fontSize: 14, color: isIn ? "var(--ok)" : "var(--bad)" }}>
                    {isIn ? "+" : "-"}{FM.fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Per-person status ---------- */
function AdminPeople() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | paid | unpaid
  const mi = FM.currentMonthIndex;

  const rows = useMemo(() => {
    let r = [...FM.students].sort((a, b) => a.id.localeCompare(b.id));
    if (q.trim()) r = r.filter((s) => s.name.includes(q) || s.id.includes(q));
    if (filter === "paid") r = r.filter((s) => s.pays[mi] === "paid");
    if (filter === "unpaid") r = r.filter((s) => s.pays[mi] === "unpaid" || s.pays[mi] === "pending");
    return r;
  }, [q, filter, mi]);

  const cm = FM.countFor(mi);
  const cellColor = { paid: ["var(--ok-bg)", "var(--ok)"], unpaid: ["var(--bad-bg)", "var(--bad)"],
    pending: ["var(--warn-bg)", "var(--warn)"], future: ["transparent", "var(--line2)"] };

  return (
    <div>
      {/* summary chips */}
      <div className="grid stat-grid people-stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        {[["ทั้งหมด", cm.total, "var(--ink)", "var(--mut-bg)", "users"],
          ["จ่ายแล้ว", cm.paid, "var(--ok)", "var(--ok-bg)", "checkCircle"],
          ["รอตรวจ", cm.pending, "var(--warn)", "var(--warn-bg)", "clock"],
          ["ค้างจ่าย", cm.unpaid, "var(--bad)", "var(--bad-bg)", "alert"]].map(([l, n, c, bg, ic], i) => (
          <div key={l} className="card stat reveal" style={{ animationDelay: i * .05 + "s", padding: "15px 16px" }}>
            <div className="stat-label"><span className="stat-ic" style={{ background: bg, color: c }}><Icon name={ic} size={16} /></span>{l}</div>
            <div className="stat-val num" style={{ fontSize: 24, color: c }}>{n}<span className="muted" style={{ fontSize: 13 }}> คน</span></div>
          </div>
        ))}
      </div>

      <div className="card reveal" style={{ animationDelay: ".1s", overflow: "hidden" }}>
        <div className="row between wrap gap12" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="section-title">สถานะรายบุคคล · เดือน {FM.thisMonth.full}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>เรียงตามรหัสนักศึกษา (น้อย → มาก)</div>
          </div>
          <div className="row gap8 wrap">
            <div className="copy-field" style={{ padding: "8px 12px" }}>
              <Icon name="search" size={16} className="muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัส"
                style={{ border: "none", background: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, width: 150 }} />
            </div>
            <div className="seg">
              {[["all", "ทั้งหมด"], ["paid", "จ่าย"], ["unpaid", "ค้าง"]].map(([k, l]) => (
                <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ-นามสกุล</th>
                <th className="hide-mobile" style={{ minWidth: 230 }}>รายเดือน (มิ.ย.68 → พ.ค.69)</th>
                <th style={{ textAlign: "right" }}>เดือนนี้</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id}>
                  <td className="muted num" style={{ fontSize: 12 }}>{i + 1}</td>
                  <td><span className="sid">{s.id}</span></td>
                  <td>
                    <div className="row gap8">
                      <Avatar name={s.name} hue={s.avatarHue} size={30} />
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="hide-mobile">
                    <div className="mgrid">
                      {s.pays.map((p, mIdx) => {
                        const c = cellColor[p];
                        return (
                          <div key={mIdx} className="mcell" title={FM.months[mIdx].full + " · " + p}
                            style={{ background: c[0], color: c[1], border: p === "future" ? "1px dashed var(--line)" : "none" }}>
                            {p === "paid" ? <Icon name="check" size={12} stroke={3} />
                              : p === "pending" ? <Icon name="clock" size={11} stroke={2.6} />
                              : p === "unpaid" ? <Icon name="x" size={11} stroke={2.6} />
                              : <span style={{ opacity: .3 }}>·</span>}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Badge status={s.pays[mi]} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 36, fontSize: 14 }}>ไม่พบรายการ</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Verification queue (manual review) ---------- */
function AdminVerify() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await API.fetchVerificationQueue();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, confirmed) => {
    setActing(id);
    try {
      const payment = items.find((q) => q.id === id);
      await API.confirmPayment(id, confirmed);
      // Auto-create transaction record when confirmed
      if (confirmed && payment) {
        const studentName = payment.students?.name || payment.student_id;
        const monthName = payment.month_periods?.month_full || "";
        const accId = FM.accounts?.[0]?.id || null;
        await API.recordTransaction(accId, "income", "ค่ากองทุน · " + studentName, payment.amount, monthName).catch(() => {});
      }
      setItems((x) => x.filter((q) => q.id !== id));
      setToast(confirmed ? "ยืนยันการชำระแล้ว" : "ปฏิเสธสลิปแล้ว");
      setTimeout(() => setToast(""), 1800);
      // Refresh FM so Dashboard/People reflect the new status
      window.__refreshFM?.();
    } catch (e) {
      setToast("เกิดข้อผิดพลาด: " + e.message);
      setTimeout(() => setToast(""), 2500);
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: 64 }}>
        <Icon name="refresh" size={30} style={{ animation: "spin 1s linear infinite", color: "var(--mut)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="card card-pad reveal row between wrap gap12" style={{ marginBottom: 16, background: "var(--brand-tint)", borderColor: "#D8E5FF" }}>
        <div className="row gap12">
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center" }}>
            <Icon name="shield" size={22} stroke={2.2} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>ตรวจสลิปการโอนเงิน</div>
            <div className="muted" style={{ fontSize: 12.5 }}>ตรวจสอบสลิปจากนักศึกษา แล้วยืนยันหรือปฏิเสธ</div>
          </div>
        </div>
        <div className="row gap8">
          <span className="badge" style={{ background: "#fff", color: "var(--brand)" }}>{items.length} รอตรวจ</span>
          <button className="btn btn-ghost btn-sm" onClick={load}><Icon name="refresh" size={14} /></button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card card-pad reveal" style={{ textAlign: "center", padding: 48 }}>
          <span style={{ width: 56, height: 56, borderRadius: 16, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <Icon name="checkCircle" size={28} stroke={2.2} />
          </span>
          <div style={{ fontWeight: 700, fontSize: 16 }}>ตรวจครบทุกสลิปแล้ว</div>
          <div className="muted" style={{ fontSize: 13.5 }}>ไม่มีสลิปค้างรอการตรวจสอบ</div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {items.map((it, idx) => {
            const studentName = it.students?.name || it.student_id;
            const studentId = it.students?.id || "";
            const monthName = it.month_periods?.month_full || "";
            const uploadedAt = new Date(it.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
            const isActing = acting === it.id;
            return (
              <div key={it.id} className="card reveal" style={{ animationDelay: idx * .06 + "s", overflow: "hidden" }}>
                {it.slip_image_url ? (
                  <a href={it.slip_image_url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                    <img src={it.slip_image_url} alt="สลิป" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#f5f5f5" }} />
                  </a>
                ) : (
                  <div style={{ height: 120, background: "var(--bg2)", display: "grid", placeItems: "center" }}>
                    <span className="muted" style={{ fontSize: 13 }}>ไม่มีรูปสลิป</span>
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <div className="row between gap8" style={{ marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{studentName}</span>
                    <span className="num muted" style={{ fontSize: 12 }}>{studentId}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>เดือน {monthName} · ส่งเมื่อ {uploadedAt}</div>
                  <div className="row between" style={{ padding: "8px 12px", background: "var(--surface2)", borderRadius: 10, marginBottom: 14 }}>
                    <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>ยอดโอน</span>
                    <span className="num" style={{ fontWeight: 700, fontSize: 15 }}>{FM.fmt(it.amount)}</span>
                  </div>
                  <div className="row gap8">
                    <button className="btn btn-bad btn-sm" style={{ flex: 1 }} disabled={isActing} onClick={() => act(it.id, false)}>
                      <Icon name="x" size={15} stroke={2.6} /> ปฏิเสธ
                    </button>
                    <button className="btn btn-ok btn-sm" style={{ flex: 2 }} disabled={isActing} onClick={() => act(it.id, true)}>
                      {isActing
                        ? <Icon name="refresh" size={15} style={{ animation: "spin 1s linear infinite" }} />
                        : <Icon name="check" size={15} stroke={2.6} />}
                      ยืนยันการชำระ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Toast msg={toast} />
    </div>
  );
}

/* ---------- Admin student management ---------- */
function AdminStudents() {
  const [students, setStudents] = useState(FM.students || []);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ id: "", name: "", avatarHue: 220 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const resetForm = () => {
    setFormData({ id: "", name: "", avatarHue: 220 });
    setEditId(null);
  };

  const handleAddClick = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEditClick = (student) => {
    setFormData({
      id: student.id,
      name: student.name,
      avatarHue: student.avatarHue || 220,
    });
    setEditId(student.id);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.id.trim() || !formData.name.trim()) {
      setToast("กรุณากรอกรหัสนักศึกษาและชื่อ");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        await API.updateStudent(editId, {
          name: formData.name,
          avatar_hue: formData.avatarHue,
        });
      } else {
        await API.createStudent({
          id: formData.id,
          name: formData.name,
          avatar_hue: formData.avatarHue,
        });
      }

      // Refresh student list
      const updated = await API.fetchStudents();
      setStudents(updated);
      setFormOpen(false);
      resetForm();
      setToast(editId ? "แก้ไขข้อมูลสำเร็จ" : "เพิ่มนักศึกษาสำเร็จ");
      setTimeout(() => setToast(""), 2000);
    } catch (error) {
      console.error("Error saving student:", error);
      setToast("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!confirm("ยืนยันการลบนักศึกษานี้?")) return;

    setLoading(true);
    try {
      await API.deleteStudent(studentId);
      const updated = await API.fetchStudents();
      setStudents(updated);
      setToast("ลบนักศึกษาสำเร็จ");
      setTimeout(() => setToast(""), 2000);
    } catch (error) {
      console.error("Error deleting student:", error);
      setToast("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>รายชื่อนักศึกษา ({students.length})</div>
          <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 4 }}>จัดการข้อมูลนักศึกษาในระบบ</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleAddClick} disabled={loading}>
          <Icon name="plus" size={16} stroke={2.4} /> เพิ่มนักศึกษา
        </button>
      </div>

      {/* Student List */}
      {students.length > 0 && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th style={{ textAlign: "right" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.name} hue={s.avatarHue || 220} size={34} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{s.name}</div>
                          <div className="sid" style={{ fontSize: 12, color: "var(--mut)" }}>{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(s)} disabled={loading} title="แก้ไข" style={{ padding: "6px 10px" }}>
                          <Icon name="pen" size={15} /> แก้ไข
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)} disabled={loading} title="ลบ" style={{ padding: "6px 10px", color: "var(--bad)", borderColor: "var(--bad-bg)" }}>
                          <Icon name="trash" size={15} /> ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {students.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <Icon name="users" size={40} style={{ color: "var(--mut)", marginBottom: 12 }} />
          <div style={{ color: "var(--mut)", fontSize: 14 }}>ยังไม่มีข้อมูลนักศึกษา</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleAddClick}>
            เพิ่มนักศึกษารายแรก
          </button>
        </div>
      )}

      {/* Add/Edit Form Sheet */}
      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา"} maxW={500}>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label className="login-label">รหัสนักศึกษา</label>
            <input
              type="text"
              className="login-input"
              placeholder="เช่น 6710405001"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={editId !== null || loading}
            />
          </div>
          <div>
            <label className="login-label">ชื่อ-นามสกุล</label>
            <input
              type="text"
              className="login-input"
              placeholder="เช่น นายกันต์ ศรีสุข"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <Icon name="refresh" size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="check" size={16} />}
              {editId ? "บันทึก" : "เพิ่ม"}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setFormOpen(false)} disabled={loading}>
              ยกเลิก
            </button>
          </div>
        </div>
      </Sheet>

      <Toast msg={toast} />
    </div>
  );
}

const BANK_COLORS = ["#4E2A84","#0F9D58","#1A73E8","#E53935","#F57C00","#00838F","#37474F"];
const EMPTY_ACCOUNT = { bank_name: "", bank_code: "", account_number: "", promptpay: "", holder_name: "", status: "active", bank_color: "#4E2A84" };

function AdminAccounts() {
  const [accounts, setAccounts] = useState(FM.accounts || []);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_ACCOUNT);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const normalizeAcc = (a) => ({ ...a, number: a.account_number, holder: a.holder_name, bankName: a.bank_name, bankCode: a.bank_code, bankColor: a.bank_color, active: a.status === "active" });

  const openAdd = () => { setForm(EMPTY_ACCOUNT); setEditId(null); setFormOpen(true); };
  const openEdit = (a) => {
    setForm({ bank_name: a.bank_name, bank_code: a.bank_code, account_number: a.account_number, promptpay: a.promptpay || "", holder_name: a.holder_name, status: a.status, bank_color: a.bank_color || "#4E2A84" });
    setEditId(a.id); setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ลบบัญชีนี้?")) return;
    setLoading(true);
    try {
      await API.deleteAccount(id);
      const updated = accounts.filter((a) => a.id !== id);
      setAccounts(updated); FM.accounts = updated.map(normalizeAcc);
      showToast("ลบบัญชีแล้ว");
    } catch (e) { showToast("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.holder_name.trim()) {
      showToast("กรุณากรอกข้อมูลให้ครบ"); return;
    }
    setLoading(true);
    try {
      if (editId) {
        const updated = await API.updateAccount(editId, form);
        const list = accounts.map((a) => a.id === editId ? updated : a);
        setAccounts(list); FM.accounts = list.map(normalizeAcc);
        showToast("แก้ไขบัญชีแล้ว");
      } else {
        const created = await API.createAccount(form);
        const list = [...accounts, created];
        setAccounts(list); FM.accounts = list.map(normalizeAcc);
        showToast("เพิ่มบัญชีแล้ว");
      }
      setFormOpen(false);
    } catch (e) { showToast("เกิดข้อผิดพลาด: " + e.message); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div className="section-title">บัญชีธนาคารทั้งหมด {accounts.length} บัญชี</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd} disabled={loading}>
          <Icon name="plus" size={16} /> เพิ่มบัญชี
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {accounts.length === 0 && <div className="card card-pad muted" style={{ textAlign: "center" }}>ยังไม่มีบัญชีธนาคาร</div>}
        {accounts.map((a) => (
          <div key={a.id} className="card card-pad">
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <div className="row gap12">
                <span style={{ width: 48, height: 48, borderRadius: 13, background: a.bank_color || "#4E2A84", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {(a.bank_code || "").slice(0, 2)}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{a.bank_name}</div>
                  <div className="num muted" style={{ fontSize: 13, marginTop: 2 }}>{a.account_number}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{a.holder_name}</div>
                  {a.promptpay && <div className="muted" style={{ fontSize: 12 }}>พร้อมเพย์: {a.promptpay}</div>}
                </div>
              </div>
              <div className="row gap8">
                <span className="badge" style={{ background: a.status === "active" ? "var(--ok-bg)" : "var(--mut-bg)", color: a.status === "active" ? "var(--ok)" : "var(--mut)" }}>
                  {a.status === "active" ? "ใช้งาน" : "ปิดรับ"}
                </span>
                <button className="icon-btn" onClick={() => openEdit(a)} disabled={loading} title="แก้ไข"><Icon name="pen" size={16} /></button>
                <button className="icon-btn" onClick={() => handleDelete(a.id)} disabled={loading} title="ลบ" style={{ color: "var(--bad)" }}><Icon name="trash" size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"} maxW={420}>
        <div style={{ display: "grid", gap: 12 }}>
          <div><label className="login-label">ชื่อธนาคาร</label>
            <input className="login-input" placeholder="เช่น ไทยพาณิชย์" value={form.bank_name} onChange={(e) => f("bank_name", e.target.value)} disabled={loading} /></div>
          <div><label className="login-label">รหัสธนาคาร</label>
            <input className="login-input" placeholder="เช่น SCB, KBANK" value={form.bank_code} onChange={(e) => f("bank_code", e.target.value.toUpperCase())} disabled={loading} /></div>
          <div><label className="login-label">เลขบัญชี</label>
            <input className="login-input" placeholder="เช่น 123-4-56789-0" value={form.account_number} onChange={(e) => f("account_number", e.target.value)} disabled={loading} /></div>
          <div><label className="login-label">พร้อมเพย์ (ถ้ามี)</label>
            <input className="login-input" placeholder="เช่น 098-765-4321" value={form.promptpay} onChange={(e) => f("promptpay", e.target.value)} disabled={loading} /></div>
          <div><label className="login-label">ชื่อเจ้าของบัญชี</label>
            <input className="login-input" placeholder="เช่น น.ส. ปาณิสรา รัตนพร" value={form.holder_name} onChange={(e) => f("holder_name", e.target.value)} disabled={loading} /></div>
          <div><label className="login-label">สถานะ</label>
            <select className="login-input" value={form.status} onChange={(e) => f("status", e.target.value)} disabled={loading}>
              <option value="active">ใช้งาน (รับเงินได้)</option>
              <option value="archived">ปิดรับ (บัญชีเก่า)</option>
            </select></div>
          <div><label className="login-label">สีธนาคาร</label>
            <div className="row gap8" style={{ marginTop: 6 }}>
              {BANK_COLORS.map((c) => (
                <button key={c} onClick={() => f("bank_color", c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.bank_color === c ? "3px solid var(--ink)" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <Icon name="refresh" size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="check" size={16} />}
              {editId ? "บันทึก" : "เพิ่ม"}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setFormOpen(false)} disabled={loading}>ยกเลิก</button>
          </div>
        </div>
      </Sheet>

      <Toast msg={toast} />
    </div>
  );
}

/* ---------- Expenses / Withdrawals ---------- */
const EXPENSE_TYPES = [
  { value: "withdrawal", label: "เบิกเงิน / ถอนเงิน" },
  { value: "expense", label: "ค่าใช้จ่าย / จัดซื้อ" },
  { value: "other", label: "อื่นๆ" },
];

function AdminExpenses() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", type: "expense", description: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await API.fetchAllTransactions(100);
      setTxs(data.filter((t) => t.type !== "income" && t.type !== "in"));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const resetForm = () => setForm({ title: "", amount: "", type: "expense", description: "" });

  const handleSubmit = async () => {
    if (!form.title.trim()) { setToast("กรุณาระบุรายการ"); setTimeout(() => setToast(""), 1800); return; }
    const amt = parseInt(form.amount);
    if (!amt || amt <= 0) { setToast("กรุณาระบุจำนวนเงินที่ถูกต้อง"); setTimeout(() => setToast(""), 1800); return; }
    setSaving(true);
    try {
      const accId = FM.accounts?.[0]?.id || null;
      const tx = await API.recordTransaction(accId, form.type, form.title.trim(), amt, form.description.trim());
      setTxs((p) => [tx, ...p]);
      setFormOpen(false);
      resetForm();
      setToast("บันทึกรายจ่ายแล้ว");
      setTimeout(() => setToast(""), 1800);
      window.__refreshFM?.();
    } catch (e) {
      setToast("เกิดข้อผิดพลาด: " + e.message);
      setTimeout(() => setToast(""), 2500);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    try {
      await API.deleteTransaction(id);
      setTxs((p) => p.filter((t) => t.id !== id));
      setToast("ลบรายการแล้ว");
      setTimeout(() => setToast(""), 1800);
      window.__refreshFM?.();
    } catch (e) {
      setToast("ลบไม่สำเร็จ: " + e.message);
      setTimeout(() => setToast(""), 2500);
    }
  };

  const totalExpenses = txs.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div>
      {/* summary bar */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        {[
          { label: "รายจ่ายทั้งหมด", val: FM.fmt(totalExpenses), ic: "arrowUp", bg: "var(--bad-bg)", fg: "var(--bad)" },
          { label: "ยอดรับสะสม", val: FM.fmt(FM.totals.received), ic: "arrowDown", bg: "var(--ok-bg)", fg: "var(--ok)" },
          { label: "คงเหลือที่ใช้ได้", val: FM.fmt(FM.totals.available), ic: "wallet", bg: "var(--brand-bg)", fg: "var(--brand)" },
        ].map((s) => (
          <div key={s.label} className="card stat reveal">
            <div className="stat-label"><span className="stat-ic" style={{ background: s.bg, color: s.fg }}><Icon name={s.ic} size={17} /></span>{s.label}</div>
            <div className="stat-val num">{s.val}</div>
          </div>
        ))}
      </div>

      {/* header + add button */}
      <div className="row between" style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>รายการถอน / ใช้จ่าย ({txs.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setFormOpen(true); }}>
          <Icon name="plus" size={16} stroke={2.4} /> เพิ่มรายการ
        </button>
      </div>

      {loading ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
          <Icon name="refresh" size={28} style={{ animation: "spin 1s linear infinite", color: "var(--mut)" }} />
        </div>
      ) : txs.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
          <Icon name="arrowUp" size={32} style={{ color: "var(--mut)", opacity: .4 }} />
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 12 }}>ยังไม่มีรายการ</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>กดปุ่ม "เพิ่มรายการ" เพื่อบันทึกการเบิกหรือค่าใช้จ่าย</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {txs.map((tx, idx) => {
            const typeLabel = EXPENSE_TYPES.find((t) => t.value === tx.type)?.label || tx.type;
            const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "";
            const timeStr = tx.created_at ? new Date(tx.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";
            return (
              <div key={tx.id} className="reveal" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: idx < txs.length - 1 ? "1px solid var(--line)" : "none", animationDelay: idx * .04 + "s" }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bad-bg)", color: "var(--bad)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="arrowUp" size={18} stroke={2.4} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {typeLabel}{tx.description ? " · " + tx.description : ""} · {dateStr} {timeStr}
                  </div>
                </div>
                <div className="num" style={{ fontWeight: 700, fontSize: 15, color: "var(--bad)", marginRight: 12 }}>
                  -{FM.fmt(tx.amount)}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--bad)", borderColor: "var(--bad-bg)", padding: "5px 10px" }} onClick={() => handleDelete(tx.id)}>
                  <Icon name="x" size={14} stroke={2.6} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form sheet */}
      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title="เพิ่มรายการถอน / ใช้จ่าย" maxW={420}>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="login-label">ประเภทรายการ</label>
            <select className="login-input" value={form.type} onChange={(e) => f("type", e.target.value)} disabled={saving}>
              {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="login-label">รายการ / หัวข้อ</label>
            <input className="login-input" placeholder="เช่น ค่าจัดซื้ออุปกรณ์, ค่าเดินทาง" value={form.title} onChange={(e) => f("title", e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="login-label">จำนวนเงิน (บาท)</label>
            <input className="login-input" type="number" placeholder="เช่น 500" value={form.amount} onChange={(e) => f("amount", e.target.value)} disabled={saving} min="1" />
          </div>
          <div>
            <label className="login-label">หมายเหตุ (ไม่บังคับ)</label>
            <input className="login-input" placeholder="รายละเอียดเพิ่มเติม" value={form.description} onChange={(e) => f("description", e.target.value)} disabled={saving} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={saving}>
              {saving ? <Icon name="refresh" size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="check" size={16} />} บันทึก
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setFormOpen(false)} disabled={saving}>ยกเลิก</button>
          </div>
        </div>
      </Sheet>

      <Toast msg={toast} />
    </div>
  );
}

Object.assign(window, { AdminDashboard, AdminPeople, AdminVerify, AdminStudents, AdminAccounts, AdminExpenses, BarChart });
