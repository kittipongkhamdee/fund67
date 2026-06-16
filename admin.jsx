/* ============================================================
   Admin / เหรัญญิก views: balance summary, per-person status,
   AI verification queue.
   ============================================================ */

/* ---------- mini bar chart ---------- */
function BarChart({ data, labels }) {
  const max = Math.max(...data.filter((d) => d != null), 1);
  const mounted = useMounted(150);
  return (
    <div className="row" style={{ alignItems: "flex-end", gap: 7, height: 120, marginTop: 4 }}>
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
  );
}

/* ---------- Admin dashboard ---------- */
function AdminDashboard() {
  const [acc, setAcc] = useState("all"); // all | scb-current | kbank-old
  const t = FM.totals;
  const view = acc === "all"
    ? { received: t.received, withdrawn: t.withdrawn, balance: t.balance, available: t.available, reserved: t.reserved }
    : (() => { const a = FM.accounts.find((x) => x.id === acc); return { received: a.received, withdrawn: a.withdrawn, balance: a.balance, available: a.balance, reserved: 0 }; })();

  const cm = FM.countFor(FM.currentMonthIndex);
  const paidPct = cm.total > 0 ? cm.paid / cm.total : 0;

  const stats = [
    { label: "ยอดเงินทั้งหมด", val: view.received, ic: "trend", bg: "var(--brand-bg)", fg: "var(--brand)", glow: "#0B5FFF", foot: "รับเข้าสะสมทุกบัญชี" },
    { label: "คงเหลือ", val: view.balance, ic: "wallet", bg: "var(--ok-bg)", fg: "var(--ok)", glow: "#0E8F5B", foot: "ยอดในบัญชีปัจจุบัน" },
    { label: "ถอน / ใช้จ่าย", val: view.withdrawn, ic: "arrowUp", bg: "var(--bad-bg)", fg: "var(--bad)", glow: "#D1453B", foot: "รายจ่ายสะสม" },
    { label: "คงเหลือที่ใช้ได้", val: view.available, ic: "shield", bg: "var(--warn-bg)", fg: "var(--warn)", glow: "#B7791F", foot: view.reserved ? "กันไว้ " + FM.fmt(view.reserved) : "พร้อมใช้งาน" },
  ];

  return (
    <div>
      {/* account selector */}
      <div className="row between wrap gap12" style={{ marginBottom: 16 }}>
        <div className="seg">
          <button className={acc === "all" ? "on" : ""} onClick={() => setAcc("all")}>รวมทุกบัญชี</button>
          {FM.accounts.map((a) => (
            <button key={a.id} className={acc === a.id ? "on" : ""} onClick={() => setAcc(a.id)}>
              {a.bankCode} {a.status === "archived" ? "· เก่า" : "· ล่าสุด"}
            </button>
          ))}
        </div>
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

      <div className="grid mt16" style={{ gridTemplateColumns: "1.15fr .85fr" }}>
        {/* collection chart */}
        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".1s" }}>
          <div className="row between">
            <div>
              <div className="section-title">ยอดเก็บรายเดือน</div>
              <div className="muted" style={{ fontSize: 12.5 }}>ปีการศึกษา 2568 · {FM.fmt(FM.MONTHLY_FEE)}/คน/เดือน</div>
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
      <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
                <div className="num" style={{ fontWeight: 700, fontSize: 15 }}>{FM.fmt(a.balance)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad reveal grid-2" style={{ animationDelay: ".24s" }}>
          <div className="section-title" style={{ marginBottom: 6 }}>รายการล่าสุด</div>
          <div>
            {FM.ledger.slice(0, 5).map((tx) => (
              <div key={tx.id} className="lrow">
                <span className="lrow-ic" style={{ background: tx.type === "in" ? "var(--ok-bg)" : "var(--bad-bg)", color: tx.type === "in" ? "var(--ok)" : "var(--bad)" }}>
                  <Icon name={tx.type === "in" ? "arrowDown" : "arrowUp"} size={18} stroke={2.4} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.title}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{tx.when} · {tx.sub}</div>
                </div>
                <div className="num" style={{ fontWeight: 700, fontSize: 14, color: tx.type === "in" ? "var(--ok)" : "var(--ink)" }}>
                  {tx.type === "in" ? "+" : ""}{FM.fmt(tx.amount)}
                </div>
              </div>
            ))}
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
      <div className="grid stat-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
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

/* ---------- AI verification queue ---------- */
function AdminVerify() {
  const [items, setItems] = useState(FM.queue);
  const [toast, setToast] = useState("");
  const act = (id, kind) => {
    setItems((x) => x.filter((q) => q.id !== id));
    setToast(kind === "ok" ? "ยืนยันการชำระแล้ว" : "ปฏิเสธสลิปแล้ว");
    setTimeout(() => setToast(""), 1800);
  };
  return (
    <div>
      <div className="card card-pad reveal row between wrap gap12" style={{ marginBottom: 16, background: "var(--brand-tint)", borderColor: "#D8E5FF" }}>
        <div className="row gap12">
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center" }}>
            <Icon name="spark2" size={22} fill="#fff" stroke={0} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI ช่วยตรวจสลิปอัตโนมัติ</div>
            <div className="muted" style={{ fontSize: 12.5 }}>อ่านยอด/วันที่/บัญชีปลายทาง ตรวจสลิปซ้ำ แล้วให้คุณยืนยันขั้นสุดท้าย</div>
          </div>
        </div>
        <span className="badge" style={{ background: "#fff", color: "var(--brand)" }}>{items.length} รอตรวจ</span>
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
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {items.map((it, idx) => {
            const flagged = it.ai.status !== "match";
            return (
              <div key={it.id} className="card reveal grid-2" style={{ animationDelay: idx * .06 + "s", overflow: "hidden" }}>
                <div className="row gap12" style={{ padding: 16 }}>
                  {/* slip thumb */}
                  <div className="slip-ph" style={{ width: 70, height: 92, flexShrink: 0, padding: 9, position: "relative" }}>
                    <div className="shimmer" style={{ height: 6, width: "70%", marginBottom: 6, animation: "none", background: "var(--line)" }} />
                    <div style={{ height: 14, width: "80%", marginBottom: 8, background: "var(--line2)", borderRadius: 4 }} />
                    <div style={{ height: 5, width: "60%", marginBottom: 4, background: "var(--line)", borderRadius: 4 }} />
                    <div style={{ height: 5, width: "75%", background: "var(--line)", borderRadius: 4 }} />
                    <span style={{ position: "absolute", bottom: 6, right: 6, color: it.ai.bank === "SCB" ? "#4E2A84" : "var(--mut)", fontSize: 9, fontWeight: 700 }}>{it.ai.bank}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row between gap8">
                      <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{it.student}</span>
                      <Badge status={it.ai.status} size="sm" />
                    </div>
                    <div className="sid" style={{ marginTop: 2 }}>{it.sid}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>ส่งเมื่อ {it.uploaded} · {it.month}</div>
                    {/* AI confidence */}
                    <div className="row gap8" style={{ marginTop: 9 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--bg2)", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{ width: (it.ai.confidence * 100) + "%", height: "100%",
                          background: it.ai.confidence > .85 ? "var(--ok)" : it.ai.confidence > .6 ? "var(--warn)" : "var(--bad)",
                          borderRadius: 20 }} />
                      </div>
                      <span className="num muted" style={{ fontSize: 11.5, fontWeight: 700 }}>{Math.round(it.ai.confidence * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* extracted */}
                <div style={{ padding: "0 16px 14px" }}>
                  <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12.5 }}>
                    {[["ยอดโอน", FM.fmt(it.ai.amount)], ["วันที่", it.ai.date], ["เวลา", it.ai.time], ["อ้างอิง", it.ai.ref]].map(([k, v]) => (
                      <div key={k} className="row between" style={{ background: "var(--surface2)", padding: "7px 10px", borderRadius: 9 }}>
                        <span className="muted" style={{ fontWeight: 600 }}>{k}</span>
                        <span className="num" style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {flagged && (
                    <div className="row gap8" style={{ marginTop: 10, padding: "9px 11px", background: it.ai.status === "duplicate" ? "var(--bad-bg)" : "var(--warn-bg)", borderRadius: 10 }}>
                      <Icon name="alert" size={15} stroke={2.4} style={{ color: it.ai.status === "duplicate" ? "var(--bad)" : "var(--warn)", flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: it.ai.status === "duplicate" ? "var(--bad)" : "var(--warn)" }}>{it.ai.note}</span>
                    </div>
                  )}
                  <div className="row gap8" style={{ marginTop: 12 }}>
                    <button className="btn btn-bad btn-sm" style={{ flex: 1 }} onClick={() => act(it.id, "no")}>
                      <Icon name="x" size={15} stroke={2.6} /> ปฏิเสธ
                    </button>
                    <button className="btn btn-ok btn-sm" style={{ flex: 2 }} onClick={() => act(it.id, "ok")}>
                      <Icon name="check" size={15} stroke={2.6} /> {flagged ? "ยืนยันด้วยตนเอง" : "ยืนยันการชำระ"}
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
          avatarHue: formData.avatarHue,
        });
      } else {
        await API.createStudent({
          id: formData.id,
          name: formData.name,
          avatarHue: formData.avatarHue,
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
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ-นามสกุล</th>

                  <th style={{ textAlign: "right" }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td><span className="sid">{s.id}</span></td>
                    <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={s.name} hue={s.avatarHue || 220} size={32} />
                      <div>{s.name}</div>
                    </td>

                    <td style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button className="icon-btn" onClick={() => handleEditClick(s)} disabled={loading} title="แก้ไข">
                        <Icon name="pen" size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(s.id)} disabled={loading} title="ลบ" style={{ color: "var(--bad)" }}>
                        <Icon name="trash" size={16} />
                      </button>
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

Object.assign(window, { AdminDashboard, AdminPeople, AdminVerify, AdminStudents, BarChart });
