/* ============================================================
   App shell — auth guard, nav, routing, transitions.
   ============================================================ */

const NAV = {
  student: [
    { k: "home", label: "กองทุนของฉัน", icon: "wallet" },
  ],
  admin: [
    { k: "dashboard", label: "สรุปยอด", icon: "home" },
    { k: "people", label: "รายบุคคล", icon: "users" },
    { k: "verify", label: "ตรวจสลิป", icon: "shield", badge: FM.queue.length },
    { k: "export", label: "ส่งออกรายงาน", icon: "download" },
  ],
};
const TITLES = {
  home: ["กองทุนของฉัน", "ชำระค่ากองทุนและติดตามสถานะรายเดือน"],
  dashboard: ["สรุปยอดกองทุน", "ภาพรวมการเงินทุกบัญชี อัปเดตแบบเรียลไทม์"],
  people: ["สรุปรายบุคคล", "สถานะการชำระของนักศึกษาทุกคน"],
  verify: ["ตรวจสอบสลิป", "AI ช่วยตรวจ คุณยืนยันขั้นสุดท้าย"],
  export: ["ส่งออกรายงาน", "ดาวน์โหลดสรุปรายเดือน / รายปีการศึกษา"],
};

function App() {
  const [auth, setAuth] = useState(null);  // null = ยังไม่ login
  const [tab, setTab] = useState("dashboard");
  const [pay, setPay] = useState(false);
  const [paid, setPaid] = useState(false);
  const [toast, setToast] = useState("");

  const login = (a) => {
    setAuth(a);
    setTab(NAV[a.role][0].k);
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
  const items = NAV[role];
  const [title, sub] = TITLES[tab] || ["", ""];
  const me = student || FM.me;
  const thisStatus = paid ? "paid" : me.pays[FM.currentMonthIndex];

  const Page = () => {
    if (role === "student") return <StudentHome paid={paid} onPay={() => setPay(true)} student={me} />;
    if (tab === "dashboard") return <AdminDashboard />;
    if (tab === "people") return <AdminPeople />;
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
            <div className="brand-sub">ห้อง IT-A · {FM.students.length} คน</div>
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

          <div key={role + tab} className="fade-swap">
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
      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
