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


/* ---------- Slip upload ---------- */
function AIVerify({ onConfirm, onBack }) {
  const [phase, setPhase] = useState("pick"); // pick | uploading | done | error
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErrMsg("");
    setPhase("pick");
  };

  const handleUpload = async () => {
    if (!file) return;
    setPhase("uploading");
    try {
      const slipUrl = await API.uploadSlipToStorage(file);
      const monthPeriodId = FM.months[FM.currentMonthIndex]?.id;
      await API.createPendingPayment(FM.me?.id, monthPeriodId, FM.MONTHLY_FEE, slipUrl);
      setPhase("done");
    } catch (e) {
      setErrMsg(e.message || "อัปโหลดไม่สำเร็จ");
      setPhase("error");
    }
  };

  if (phase === "done") {
    return (
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <span style={{ width: 56, height: 56, borderRadius: 16, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
          <Icon name="checkCircle" size={28} stroke={2.2} />
        </span>
        <div style={{ fontWeight: 700, fontSize: 16 }}>ส่งสลิปสำเร็จแล้ว!</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>เหรัญญิกจะตรวจสอบและยืนยันการชำระเงินของคุณ</div>
        <button className="btn btn-primary mt16" style={{ width: "100%" }} onClick={onConfirm}>
          <Icon name="check" size={16} /> เสร็จสิ้น
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>อัปโหลดสลิปการโอนเงิน</div>
        <div className="muted" style={{ fontSize: 12.5 }}>เหรัญญิกจะตรวจสอบสลิปและยืนยันการชำระ</div>
      </div>

      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", textAlign: "center", cursor: "pointer",
          borderStyle: preview ? "solid" : "dashed", borderColor: preview ? "var(--line)" : "var(--brand)" }}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="slip preview" style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block" }} />
        ) : (
          <div style={{ padding: "36px 20px" }}>
            <Icon name="upload" size={36} style={{ color: "var(--brand)" }} />
            <div style={{ fontWeight: 600, marginTop: 10, color: "var(--brand)" }}>แตะเพื่อเลือกรูปสลิป</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>รองรับ JPG, PNG</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])} />

      {preview && (
        <button className="btn btn-ghost btn-sm mt8" style={{ fontSize: 12 }}
          onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setPhase("pick"); }}>
          <Icon name="x" size={14} /> เปลี่ยนรูป
        </button>
      )}

      {phase === "error" && errMsg && (
        <div className="login-error" style={{ marginTop: 12 }}><Icon name="alert" size={15} stroke={2.4} />{errMsg}</div>
      )}

      <div className="row gap12 mt16">
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onBack}>ยกเลิก</button>
        <button className="btn btn-primary" style={{ flex: 2 }} disabled={!file || phase === "uploading"} onClick={handleUpload}>
          {phase === "uploading"
            ? <><Icon name="refresh" size={16} style={{ animation: "spin 1s linear infinite" }} /> กำลังอัปโหลด…</>
            : <><Icon name="upload" size={16} /> ส่งสลิปให้เหรัญญิก</>}
        </button>
      </div>
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
      <Sheet open={open} onClose={onClose} title={step === "qr" ? "ชำระค่ากองทุนเดือน" + FM.thisMonth.full : "ตรวจสอบสลิป"} maxW={470}>
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
  const dueCount = FM.months.length;
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
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>ปีการศึกษา 2569</div>
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
