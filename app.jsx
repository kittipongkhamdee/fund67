/* ============================================================
   App shell — auth guard, nav, routing, transitions.
   ============================================================ */

const NAV_STUDENT = [
  { k: "home", label: "กองทุนของฉัน", icon: "wallet" },
];
const NAV_ADMIN_KEYS = [
  { k: "dashboard", label: "สรุปยอด", icon: "home" },
  { k: "people", label: "รายบุคคล", icon: "users" },
  { k: "students", label: "จัดการนักศึกษา", icon: "users" },
  { k: "accounts", label: "บัญชีกองทุน", icon: "bank" },
  { k: "expenses", label: "ถอน / ใช้จ่าย", icon: "arrowUp" },
  { k: "verify", label: "ตรวจสลิป", icon: "shield" },
  { k: "export", label: "ส่งออกรายงาน", icon: "download" },
];
const TITLES = {
  home: ["กองทุนของฉัน", "ชำระค่ากองทุนและติดตามสถานะรายเดือน"],
  dashboard: ["สรุปยอดกองทุน", "ภาพรวมการเงินทุกบัญชี อัปเดตแบบเรียลไทม์"],
  people: ["สรุปรายบุคคล", "สถานะการชำระของนักศึกษาทุกคน"],
  students: ["จัดการรหัสนักศึกษา", "เพิ่ม แก้ไข ลบข้อมูลนักศึกษาในระบบ"],
  accounts: ["บัญชีกองทุน", "เพิ่ม แก้ไข ลบบัญชีธนาคารของกองทุน"],
  expenses: ["ถอน / ใช้จ่าย", "บันทึกการเบิกเงินและรายจ่ายจากกองทุน"],
  verify: ["ตรวจสอบสลิป", "ตรวจสอบสลิปและยืนยันการชำระของนักศึกษา"],
  export: ["ส่งออกรายงาน", "ดาวน์โหลดสรุปรายเดือน / รายปีการศึกษา"],
};

function ChangePasswordSheet({ open, onClose }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const reset = () => { setCur(""); setNext(""); setConfirm(""); setErr(""); setOk(false); };

  const handleSave = async () => {
    setErr("");
    const creds = { id: FM.settings?.admin_id || "ADMIN001", password: FM.settings?.admin_password || "1234" };
    if (cur !== creds.password) { setErr("รหัสผ่านปัจจุบันไม่ถูกต้อง"); return; }
    if (next.length < 4) { setErr("รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร"); return; }
    if (next !== confirm) { setErr("รหัสผ่านใหม่ไม่ตรงกัน"); return; }
    setLoading(true);
    try {
      await API.updateSetting("admin_password", next);
      FM.settings.admin_password = next;
      setOk(true);
      setTimeout(() => { onClose(); reset(); }, 1500);
    } catch (e) {
      setErr("บันทึกไม่สำเร็จ: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={() => { onClose(); reset(); }} title="เปลี่ยนรหัสผ่านผู้ดูแล" maxW={380}>
      {ok ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ok)", fontWeight: 600 }}>
          <Icon name="check" size={32} /><div style={{ marginTop: 8 }}>เปลี่ยนรหัสผ่านสำเร็จ</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="login-label">รหัสผ่านปัจจุบัน</label>
            <input className="login-input" type="password" placeholder="••••••••" value={cur} onChange={(e) => setCur(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="login-label">รหัสผ่านใหม่</label>
            <input className="login-input" type="password" placeholder="••••••••" value={next} onChange={(e) => setNext(e.target.value)} disabled={loading} />
          </div>
          <div>
            <label className="login-label">ยืนยันรหัสผ่านใหม่</label>
            <input className="login-input" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={loading} />
          </div>
          {err && <div className="login-error"><Icon name="alert" size={15} stroke={2.4} />{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
              {loading ? <Icon name="refresh" size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="check" size={16} />} บันทึก
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { onClose(); reset(); }} disabled={loading}>ยกเลิก</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function App() {
  const [auth, setAuth] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [pay, setPay] = useState(false);
  const [paid, setPaid] = useState(false);
  const [toast, setToast] = useState("");
  const [changePw, setChangePw] = useState(false);
  const [fmVer, setFmVer] = useState(0);

  // Called after any action that changes DB data so FM re-fetches
  const refreshFM = async () => {
    try { await initializeFromSupabase(); setFmVer((v) => v + 1); } catch (e) { console.error(e); }
  };
  window.__refreshFM = refreshFM;

  const getNav = (role) => role === "admin"
    ? NAV_ADMIN_KEYS.map((n) => n.k === "verify" ? { ...n, badge: FM.queue.length } : n)
    : NAV_STUDENT;

  const login = (a) => {
    setAuth(a);
    setTab(getNav(a.role)[0].k);
    setPaid(false);
  };
  const logout = () => { setAuth(null); setPay(false); setPaid(false); setToast(""); };
  const onPaid = () => {
    setPaid(true);
    setToast("บันทึกการชำระเรียบร้อย · รอเหรัญญิกยืนยัน");
    setTimeout(() => setToast(""), 2600);
  };

  // ── Show login screen if not authenticated ──
  if (!auth) return <LoginScreen onLogin={login} />;

  const { role, student } = auth;
  const items = getNav(role);
  const [title, sub] = TITLES[tab] || ["", ""];
  const me = student || FM.me || { name: "ผู้ดูแลระบบ", id: "ADMIN001", avatarHue: 220, pays: [] };
  const thisStatus = paid ? "paid" : (me.pays?.[FM.currentMonthIndex] ?? "unpaid");

  const Page = () => {
    if (role === "student") return <StudentHome paid={paid} onPay={() => setPay(true)} student={me} />;
    if (tab === "dashboard") return <AdminDashboard />;
    if (tab === "people") return <AdminPeople />;
    if (tab === "students") return <AdminStudents />;
    if (tab === "accounts") return <AdminAccounts />;
    if (tab === "expenses") return <AdminExpenses />;
    if (tab === "verify") return <AdminVerify />;
    if (tab === "export") return <ExportView />;
    return null;
  };

  return (
    <div className="app">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="wallet" size={20} stroke={2.2} /></div>
          <div>
            <div className="brand-name">กองทุนรุ่น 67</div>
            <div className="brand-sub">{FM.students.length} คน</div>
          </div>
        </div>

        {/* role indicator chip */}
        <div style={{ padding: "4px 10px 10px" }}>
          <span className="badge" style={{ background: role === "admin" ? "var(--brand-bg)" : "var(--ok-bg)", color: role === "admin" ? "var(--brand)" : "var(--ok)", fontSize: 12 }}>
            <Icon name={role === "admin" ? "shield" : "wallet"} size={13} stroke={2.4} />
            {role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"}
          </span>
        </div>

        <div className="nav-label">เมนู</div>
        {items.map((it) => (
          <button key={it.k} className={"nav-item " + (tab === it.k ? "active" : "")} onClick={() => setTab(it.k)}>
            <span className="ni-ic"><Icon name={it.icon} size={19} /></span>
            {it.label}
            {it.badge ? <span className="nav-badge">{it.badge}</span> : null}
          </button>
        ))}

        <div className="sidebar-foot">
          <div className="nav-item" style={{ cursor: "default", marginBottom: 2 }}>
            <Avatar name={me.name} hue={me.avatarHue || 220} size={34} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me.name}</div>
              <div className="num muted" style={{ fontSize: 11 }}>{role === "admin" ? "เหรัญญิก · แอดมิน" : me.id}</div>
            </div>
          </div>
          {role === "admin" && (
            <button className="nav-item" onClick={() => setChangePw(true)} style={{ color: "var(--ink2)" }}>
              <span className="ni-ic"><Icon name="key" size={18} /></span>
              เปลี่ยนรหัสผ่าน
            </button>
          )}
          <button className="nav-item" onClick={logout} style={{ color: "var(--bad)" }}>
            <span className="ni-ic" style={{ color: "var(--bad)" }}><Icon name="logout" size={18} /></span>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="main">
        {/* mobile header */}
        <div className="mobile-head">
          <div className="brand-mark" style={{ width: 34, height: 34 }}><Icon name="wallet" size={18} stroke={2.2} /></div>
          <div style={{ flex: 1 }}>
            <div className="brand-name" style={{ fontSize: 14 }}>กองทุนรุ่น 67</div>
            <div className="muted" style={{ fontSize: 11 }}>{me.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ color: "var(--bad)", borderColor: "var(--bad-bg)", fontSize: 12 }}>
            <Icon name="logout" size={14} /> ออก
          </button>
        </div>

        <div className="main-inner">
          <div className="topbar">
            <div>
              <div className="page-title">{title}</div>
              <div className="page-sub">{sub}</div>
            </div>
            <div className="topbar-right hide-mobile">
              {role === "admin" && tab === "dashboard" && (
                <button className="btn btn-ghost btn-sm" onClick={() => setTab("export")}>
                  <Icon name="download" size={16} /> ส่งออก
                </button>
              )}
              {role === "admin" && tab !== "export" && (
                <button className="btn btn-primary btn-sm" onClick={() => setTab(tab === "verify" ? "people" : "verify")}>
                  <Icon name={tab === "verify" ? "users" : "shield"} size={16} />
                  {tab === "verify" ? "ดูรายบุคคล" : "ตรวจสลิป (" + FM.queue.length + ")"}
                </button>
              )}
              {role === "student" && thisStatus !== "paid" && (
                <button className="btn btn-primary btn-sm" onClick={() => setPay(true)}>
                  <Icon name="wallet" size={16} /> จ่ายเงินกองทุน
                </button>
              )}
            </div>
          </div>

          <div key={role + tab + fmVer} className="fade-swap">
            <Page />
          </div>
        </div>

        {/* bottom nav (mobile) */}
        <nav className="botnav">
          {items.map((it) => (
            <button key={it.k} className={"bn-item " + (tab === it.k ? "active" : "")} onClick={() => setTab(it.k)}>
              <span className="bn-ic" style={{ position: "relative" }}>
                <Icon name={it.icon} size={21} />
                {it.badge ? <span style={{ position: "absolute", top: -4, right: -8, background: "var(--bad)", color: "#fff", fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8, display: "grid", placeItems: "center", padding: "0 4px" }}>{it.badge}</span> : null}
              </span>
              {it.label.split(" ")[0]}
            </button>
          ))}
          {role === "student" && (
            <button className="bn-item" onClick={() => setPay(true)} style={{ color: "var(--brand)" }}>
              <span className="bn-ic"><Icon name="plus" size={21} stroke={2.4} /></span>
              จ่ายเงิน
            </button>
          )}
        </nav>
      </main>

      <PayFlow open={pay} onClose={() => setPay(false)} onPaid={onPaid} />
      <ChangePasswordSheet open={changePw} onClose={() => setChangePw(false)} />
      <Toast msg={toast} />
    </div>
  );
}

let __appStarted = false;
window.__startApp = () => {
  if (__appStarted) return;
  __appStarted = true;
  document.getElementById("app-loading").style.display = "none";
  document.getElementById("root").style.display = "";
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
};

// If FM already initialized (demo data), start immediately
if (window.FM) window.__startApp();
