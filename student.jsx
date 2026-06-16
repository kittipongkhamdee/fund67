/* ============================================================
   Student views: home, pay (QR + account + open-bank), AI slip
   verification, my monthly status.
   ============================================================ */

function CopyField({ label, value, icon }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div>
      <div className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <button className="copy-field" style={{ width: "100%" }} onClick={copy}>
        {icon && <Icon name={icon} size={18} className="muted" />}
        <span className="num" style={{ fontSize: 16, fontWeight: 600, flex: 1, textAlign: "left", letterSpacing: ".02em" }}>{value}</span>
        <span className="row gap8" style={{ color: copied ? "var(--ok)" : "var(--brand)", fontSize: 13, fontWeight: 700 }}>
          <Icon name={copied ? "check" : "copy"} size={16} stroke={2.4} />
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </span>
      </button>
    </div>
  );
}


/* ---------- AI slip verification ---------- */
function AIVerify({ onConfirm, onBack }) {
  const [phase, setPhase] = useState("scan"); // scan -> done
  const fields = [
    { k: "ยอดเงิน", v: FM.fmt(FM.MONTHLY_FEE), ok: true, ic: "wallet" },
    { k: "วันที่ / เวลา", v: "13 ม.ค. 2569 · 08:59", ok: true, ic: "clock" },
    { k: "ธนาคารต้นทาง", v: "ไทยพาณิชย์ (SCB)", ok: true, ic: "bank" },
    { k: "บัญชีปลายทาง", v: "123-4-56789-0 ✓ บัญชีกองทุน", ok: true, ic: "shield" },
    { k: "เลขอ้างอิง", v: "0151xxxx8821", ok: true, ic: "receipt" },
  ];
  useEffect(() => {
    const t = setTimeout(() => setPhase("done"), 2300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div>
      <div className="row gap12" style={{ alignItems: "stretch" }}>
        {/* slip preview */}
        <div className="scan-frame slip-ph" style={{ width: 150, minHeight: 196, flexShrink: 0, position: "relative", padding: 14 }}>
          <div className="shimmer" style={{ height: 10, width: "60%", marginBottom: 10 }} />
          <div className="shimmer" style={{ height: 26, width: "85%", marginBottom: 12 }} />
          <div className="shimmer" style={{ height: 8, width: "70%", marginBottom: 7 }} />
          <div className="shimmer" style={{ height: 8, width: "55%", marginBottom: 7 }} />
          <div className="shimmer" style={{ height: 8, width: "75%" }} />
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <div className="shimmer" style={{ height: 30, width: 30, borderRadius: 50 }} />
          </div>
          {phase === "scan" && <div className="scan-line" />}
          <div style={{ position: "absolute", top: 8, right: 8, background: "var(--ink)", color: "#fff",
            fontSize: 9.5, fontWeight: 700, padding: "3px 7px", borderRadius: 20 }}>สลิปโอนเงิน</div>
        </div>
        {/* AI panel */}
        <div className="card" style={{ flex: 1, padding: 16, background: "var(--brand-tint)", borderColor: "#D8E5FF" }}>
          <div className="row gap8" style={{ marginBottom: 4 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--brand)", color: "#fff", display: "grid", placeItems: "center" }}>
              <Icon name="spark2" size={15} fill="#fff" stroke={0} />
            </span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>AI ตรวจสอบสลิป</span>
            {phase === "scan"
              ? <span className="muted num" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600 }}>กำลังอ่าน…</span>
              : <Badge status="match" size="sm" />}
          </div>
          {phase === "scan" ? (
            <div style={{ paddingTop: 6 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="row gap8" style={{ padding: "9px 0" }}>
                  <span className="shimmer" style={{ width: 18, height: 18, borderRadius: 50 }} />
                  <span className="shimmer" style={{ height: 9, width: ["72%", "60%", "80%"][i] }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ paddingTop: 2 }}>
              {fields.map((f, i) => (
                <div key={f.k} className="ai-row" style={{ animationDelay: i * 90 + "ms" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 50, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center" }}>
                    <Icon name="check" size={13} stroke={3} />
                  </span>
                  <span className="muted" style={{ fontSize: 12.5, fontWeight: 600, width: 92 }}>{f.k}</span>
                  <span className="num" style={{ fontSize: 12.5, fontWeight: 600, flex: 1, textAlign: "right" }}>{f.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {phase === "done" && (
        <div className="fade-swap" style={{ marginTop: 16 }}>
          <div className="card card-pad row gap12" style={{ background: "var(--ok-bg)", borderColor: "#BCE6CD", padding: 14 }}>
            <Icon name="shield" size={22} style={{ color: "var(--ok)" }} stroke={2.2} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ok)" }}>สลิปถูกต้อง · ความเชื่อมั่น 98%</div>
              <div className="muted" style={{ fontSize: 12.5 }}>ยอดและบัญชีปลายทางตรงกับค่ากองทุนเดือนนี้ ไม่พบสลิปซ้ำ</div>
            </div>
          </div>
          <div className="row gap12" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>อัปโหลดใหม่</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={onConfirm}>
              <Icon name="checkCircle" size={18} stroke={2.2} /> ยืนยันการชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Pay flow sheet ---------- */
function PayFlow({ open, onClose, onPaid }) {
  const [step, setStep] = useState("qr");
  const qrRef = useRef(null);
  const acc = FM.accounts?.[0] || {};
  useEffect(() => { if (open) setStep("qr"); }, [open]);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const padding = 20;
    const out = document.createElement("canvas");
    out.width = canvas.width + padding * 2;
    out.height = canvas.height + padding * 2;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, padding, padding);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "promptpay-qr.png";
    a.click();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title={step === "qr" ? "ชำระค่ากองทุนเดือน " + FM.thisMonth.short : "ตรวจสอบสลิป"} maxW={470}>
        {step === "qr" ? (
          <div>
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>ยอดที่ต้องชำระ</div>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.02em" }}>{FM.fmt(FM.MONTHLY_FEE)}</div>
              </div>
              <Badge status="unpaid" />
            </div>

            {/* QR */}
            <div className="card" style={{ padding: 18, textAlign: "center",
              background: "linear-gradient(180deg,#fff,#FAFBFF)", borderColor: "#E2E8FA" }}>
              <div className="row" style={{ justifyContent: "center", gap: 8, marginBottom: 12, color: "var(--brand)", fontWeight: 700, fontSize: 13 }}>
                <Icon name="qr" size={16} stroke={2.2} /> สแกนเพื่อโอนผ่านพร้อมเพย์
              </div>
              <div style={{ display: "inline-block", padding: 12, background: "#fff", borderRadius: 18, boxShadow: "var(--sh-md)" }} ref={qrRef}>
                <QRCode text={makePromptPayPayload(acc.promptpay, FM.MONTHLY_FEE)} size={172} />
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 12, fontWeight: 600 }}>
                {acc.holder}
              </div>
            </div>

            <div className="mt16" style={{ display: "grid", gap: 12 }}>
              <CopyField label="เลขบัญชี · ไทยพาณิชย์ (บัญชีกองทุน)" value={acc.number} icon="bank" />
              <CopyField label="พร้อมเพย์" value={acc.promptpay} icon="qr" />
            </div>

            <button className="btn btn-primary mt16" style={{ width: "100%" }} onClick={downloadQR}>
              <Icon name="download" size={18} stroke={2.2} /> บันทึก QR พร้อมเพย์
            </button>

            <div className="row gap12 mt16" style={{ alignItems: "center" }}>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>โอนเสร็จแล้ว?</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            <button className="btn btn-ghost mt12" style={{ width: "100%", borderStyle: "dashed", borderColor: "var(--brand)", color: "var(--brand)" }}
              onClick={() => setStep("verify")}>
              <Icon name="upload" size={18} stroke={2.2} /> อัปโหลดสลิป · ให้ AI ตรวจสอบ
            </button>
          </div>
        ) : (
          <AIVerify onBack={() => setStep("qr")} onConfirm={() => { onPaid(); onClose(); }} />
        )}
      </Sheet>
    </>
  );
}

/* ---------- Student Home ---------- */
function StudentHome({ paid, onPay, student = FM.me }) {
  const me = student;
  const paidCount = me.pays.filter((p, i) => p === "paid").length;
  const dueCount = FM.currentMonthIndex + 1;
  const thisStatus = paid ? "paid" : me.pays[FM.currentMonthIndex];
  const totalPaid = paidCount * FM.MONTHLY_FEE;

  return (
    <div>
      {/* Hero */}
      <div className="hero reveal">
        <div className="hero-grain" />
        <div style={{ position: "relative" }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13.5, opacity: .85, fontWeight: 500 }}>สวัสดี, {me.name.split(" ")[0]} 👋</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>กองทุนรุ่น 67 · ห้อง IT-A</div>
            </div>
            <span className="num" style={{ fontSize: 12.5, fontWeight: 600, opacity: .9, background: "rgba(255,255,255,.16)", padding: "6px 11px", borderRadius: 20 }}>
              {me.id}
            </span>
          </div>

          <div className="card" style={{ marginTop: 20, padding: 18, background: "rgba(255,255,255,.13)",
            border: "1px solid rgba(255,255,255,.22)", backdropFilter: "blur(6px)", color: "#fff", boxShadow: "none" }}>
            <div className="row between">
              <div>
                <div style={{ fontSize: 12.5, opacity: .85, fontWeight: 600, whiteSpace: "nowrap" }}>ค่ากองทุนเดือน {FM.thisMonth.full}</div>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, marginTop: 3 }}>{FM.fmt(FM.MONTHLY_FEE)}</div>
              </div>
              {thisStatus === "paid"
                ? <span className="badge" style={{ background: "rgba(255,255,255,.22)", color: "#fff" }}><Icon name="check" size={14} stroke={3} /> จ่ายแล้ว</span>
                : <span className="badge" style={{ background: "#fff", color: "var(--bad)" }}><Icon name="alert" size={14} stroke={2.4} /> ยังไม่จ่าย</span>}
            </div>
            {thisStatus !== "paid" && (
              <button className="btn btn-light" style={{ width: "100%", marginTop: 15 }} onClick={onPay}>
                <Icon name="wallet" size={18} stroke={2.2} /> จ่ายเงินกองทุน
              </button>
            )}
            {thisStatus === "paid" && (
              <div className="row gap8" style={{ marginTop: 13, fontSize: 13, opacity: .92 }}>
                <Icon name="checkCircle" size={16} stroke={2.2} /> ขอบคุณ! ชำระเดือนนี้เรียบร้อยแล้ว
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mini stats */}
      <div className="grid mt16" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card stat reveal" style={{ animationDelay: ".06s" }}>
          <div className="stat-label"><span className="stat-ic" style={{ background: "var(--ok-bg)", color: "var(--ok)" }}><Icon name="checkCircle" size={17} /></span>จ่ายครบแล้ว</div>
          <div className="stat-val num">{paidCount}<span className="muted" style={{ fontSize: 16 }}> / {dueCount} เดือน</span></div>
        </div>
        <div className="card stat reveal" style={{ animationDelay: ".12s" }}>
          <div className="stat-label"><span className="stat-ic" style={{ background: "var(--brand-bg)", color: "var(--brand)" }}><Icon name="wallet" size={17} /></span>ยอดที่จ่ายสะสม</div>
          <div className="stat-val num">{FM.fmt(totalPaid)}</div>
        </div>
      </div>

      {/* my months */}
      <div className="card card-pad mt16 reveal" style={{ animationDelay: ".16s" }}>
        <div className="section-title">สถานะรายเดือนของฉัน</div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>ปีการศึกษา 2568</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {FM.months.map((m, i) => {
            const st = i === FM.currentMonthIndex ? thisStatus : me.pays[i];
            const c = { paid: ["var(--ok-bg)", "var(--ok)"], unpaid: ["var(--bad-bg)", "var(--bad)"],
              pending: ["var(--warn-bg)", "var(--warn)"], future: ["var(--mut-bg)", "var(--mut)"] }[st];
            return (
              <div key={m.key} style={{ textAlign: "center", background: c[0], borderRadius: 13, padding: "12px 4px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c[1] }}>{m.short}</div>
                <div style={{ marginTop: 7 }}>
                  <Icon name={st === "paid" ? "check" : st === "future" ? "dot" : st === "pending" ? "clock" : "x"}
                    size={16} stroke={2.6} style={{ color: c[1] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StudentHome, PayFlow, BankPicker, CopyField, BANKS });
