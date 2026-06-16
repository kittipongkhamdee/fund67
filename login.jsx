/* ============================================================
   Login screen — role select (นักศึกษา / ผู้ดูแลระบบ), student
   ID lookup, admin ID + password.
   ============================================================ */

// Admin credentials loaded from Supabase app_settings at runtime
const getAdminCreds = () => ({
  id: FM.settings?.admin_id || "ADMIN001",
  password: FM.settings?.admin_password || "1234",
});

function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("student");
  const roleRef = useRef("student"); // stays sync even when switchRole + autoFill called together
  const [sid, setSid] = useState("");
  const [pass, setPass] = useState("");
  const [found, setFound] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const inputRef = useRef(null);

  const reset = () => { setFound(null); setError(""); };
  const switchRole = (r) => { setRole(r); roleRef.current = r; setSid(""); setPass(""); reset(); };

  // Student lookup
  const lookupStudent = () => {
    if (!sid.trim()) { setError("กรุณากรอกรหัสนักศึกษา"); return; }
    reset(); setLoading(true);
    setTimeout(() => {
      const s = FM.students.find((x) => x.id === sid.trim());
      setLoading(false);
      if (s) { setFound(s); setError(""); }
      else setError("ไม่พบรหัสนักศึกษา " + sid.trim() + " ในระบบ");
    }, 800);
  };

  // Admin login
  const loginAdmin = () => {
    reset();
    const creds = getAdminCreds();
    if (sid.trim() === creds.id && pass === creds.password) {
      onLogin({ role: "admin" });
    } else {
      setError("รหัสผู้ดูแลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  const confirmStudent = () => { if (found) onLogin({ role: "student", student: found }); };

  const onKeyStudent = (e) => e.key === "Enter" && !found && lookupStudent();
  const onKeyAdmin = (e) => e.key === "Enter" && loginAdmin();

  return (
    <div className="login-bg">
      {/* outer glow blobs */}
      <div className="login-blob b1" />
      <div className="login-blob b2" />

      <div className="login-panel login-enter">
        {/* ── Left decorative panel ── */}
        <div className="login-left">
          <div className="ll-grain" />
          <div className="ll-circle c1" /><div className="ll-circle c2" /><div className="ll-circle c3" />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,.22)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", border: "1px solid rgba(255,255,255,.3)" }}>
                <Icon name="wallet" size={26} stroke={2.2} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-.01em" }}>กองทุนรุ่น 67</div>
                <div style={{ fontSize: 12.5, opacity: .8, fontWeight: 500, marginTop: 1 }}>ปีการศึกษา 2569</div>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-.02em", marginBottom: 16 }}>
              ระบบจัดการ<br />กองทุนนักศึกษา
            </div>
            <div style={{ fontSize: 14.5, opacity: .82, lineHeight: 1.65 }}>
              โอนเงิน · ตรวจสลิป AI<br />
              ดูสถานะรายบุคคล · ส่งออกรายงาน
            </div>
            {/* mini stats */}
            <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
              {[[FM.students.length + " คน", "นักศึกษา"], [FM.fmt(FM.MONTHLY_FEE), "/ เดือน"], ["AI", "ตรวจสลิป"]].map(([v, l]) => (
                <div key={l} style={{ background: "rgba(255,255,255,.15)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.2)" }}>
                  <div style={{ fontFamily: "var(--num)", fontWeight: 700, fontSize: 17 }}>{v}</div>
                  <div style={{ fontSize: 11, opacity: .8, fontWeight: 600, marginTop: 1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="login-right">
          {/* mobile brand */}
          <div className="login-mobile-brand">
            <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(145deg,var(--brand),#3D82FF)", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 8px 22px -6px rgba(11,95,255,.5)" }}>
              <Icon name="wallet" size={22} stroke={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>กองทุนรุ่น 67</div>
              <div className="muted" style={{ fontSize: 12 }}>ระบบจัดการกองทุนนักศึกษา</div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>เข้าสู่ระบบ</h2>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 5 }}>เลือกประเภทผู้ใช้และยืนยันตัวตน</p>
          </div>

          {/* role tabs */}
          <div className="seg" style={{ width: "100%", marginBottom: 24 }}>
            {[["student", "นักศึกษา", "wallet"], ["admin", "ผู้ดูแลระบบ", "shield"]].map(([k, l, ic]) => (
              <button key={k} className={role === k ? "on" : ""} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0" }}
                onClick={() => switchRole(k)}>
                <Icon name={ic} size={16} stroke={2.2} /> {l}
              </button>
            ))}
          </div>

          {/* ── Student form ── */}
          {role === "student" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="login-label">รหัสนักศึกษา</label>
                <div style={{ position: "relative" }}>
                  <Icon name="users" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--mut)" }} />
                  <input ref={inputRef} className={"login-input " + (error ? "err" : "")}
                    style={{ paddingLeft: 44 }} placeholder="เช่น 6710405001"
                    value={sid} onChange={(e) => { setSid(e.target.value); reset(); }}
                    onKeyDown={onKeyStudent} maxLength={20} />
                  {loading && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                    <Icon name="refresh" size={18} style={{ color: "var(--mut)", animation: "spin 1s linear infinite" }} />
                  </span>}
                </div>
              </div>

              {error && <div className="login-error"><Icon name="alert" size={15} stroke={2.4} />{error}</div>}

              {/* found card */}
              {found && (
                <div className="login-found">
                  <Avatar name={found.name} hue={found.avatarHue} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{found.name}</div>
                    <div className="num muted" style={{ fontSize: 12.5 }}>{found.id}</div>
                  </div>
                  <Icon name="checkCircle" size={22} style={{ color: "var(--ok)" }} stroke={2.2} />
                </div>
              )}

              {!found
                ? <button className="btn btn-primary" style={{ width: "100%", height: 52 }} onClick={lookupStudent} disabled={loading}>
                    {loading ? <Icon name="refresh" size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Icon name="search" size={18} stroke={2.2} />}
                    ค้นหาข้อมูล
                  </button>
                : <button className="btn btn-primary" style={{ width: "100%", height: 52 }} onClick={confirmStudent}>
                    <Icon name="checkCircle" size={18} stroke={2.2} /> เข้าสู่ระบบเป็น {found.nick}
                  </button>}
            </div>
          )}

          {/* ── Admin form ── */}
          {role === "admin" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="login-label">รหัสผู้ดูแล</label>
                <div style={{ position: "relative" }}>
                  <Icon name="shield" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--mut)" }} />
                  <input className={"login-input " + (error ? "err" : "")} style={{ paddingLeft: 44 }}
                    placeholder="Admin ID" value={sid}
                    onChange={(e) => { setSid(e.target.value); setError(""); }}
                    onKeyDown={onKeyAdmin} />
                </div>
              </div>
              <div>
                <label className="login-label">รหัสผ่าน</label>
                <div style={{ position: "relative" }}>
                  <Icon name="bank" size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--mut)" }} />
                  <input className={"login-input " + (error ? "err" : "")} style={{ paddingLeft: 44, paddingRight: 44 }}
                    type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={pass} onChange={(e) => { setPass(e.target.value); setError(""); }}
                    onKeyDown={onKeyAdmin} />
                  <button className="icon-btn" onClick={() => setShowPass((x) => !x)}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", width: 32, height: 32 }}>
                    <Icon name={showPass ? "x" : "copy"} size={16} style={{ color: "var(--mut)" }} />
                  </button>
                </div>
              </div>
              {error && <div className="login-error"><Icon name="alert" size={15} stroke={2.4} />{error}</div>}
              <button className="btn btn-primary" style={{ width: "100%", height: 52, marginTop: 4 }} onClick={loginAdmin}>
                <Icon name="shield" size={18} stroke={2.2} /> เข้าสู่ระบบผู้ดูแล
              </button>
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--mut)", marginTop: 4 }}>
                * รหัสผ่านเริ่มต้น: <code style={{ background: "var(--bg2)", padding: "1px 7px", borderRadius: 5 }}>1234</code> · แจ้งผู้พัฒนาเพื่อเปลี่ยนภายหลัง
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
