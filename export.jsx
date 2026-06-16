/* ============================================================
   Export view: monthly & yearly report → real PNG + PDF,
   Google Sheet / Excel buttons.
   ============================================================ */

function ExportView() {
  const [mode, setMode] = useState("month"); // month | year
  const [mi, setMi] = useState(FM.currentMonthIndex);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const ref = useRef(null);
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2000); };

  const sorted = useMemo(() => [...FM.students].sort((a, b) => a.id.localeCompare(b.id)), []);
  const cm = FM.countFor(mi);
  const fileName = mode === "month"
    ? "สรุปกองทุน-" + FM.months[mi].full.replace(" ", "")
    : "สรุปกองทุน-ปีการศึกษา2569";

  const exportPNG = async () => {
    setBusy("png");
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const a = document.createElement("a");
      a.download = fileName + ".png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      flash("ดาวน์โหลดรูปภาพ PNG แล้ว");
    } catch (e) { flash("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"); }
    setBusy("");
  };

  const exportPDF = async () => {
    setBusy("pdf");
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const img = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const w = pw - 40;
      const h = (canvas.height * w) / canvas.width;
      const pageH = ph - 40;
      let pos = 20, left = h;
      pdf.addImage(img, "PNG", 20, pos, w, h);
      left -= pageH;
      while (left > 0) { pos = left - h + 20; pdf.addPage(); pdf.addImage(img, "PNG", 20, pos, w, h); left -= pageH; }
      pdf.save(fileName + ".pdf");
      flash("ดาวน์โหลดไฟล์ PDF แล้ว");
    } catch (e) { flash("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"); }
    setBusy("");
  };

  const exportExcel = () => {
    let csv = "\uFEFF"; // BOM for Thai in Excel
    if (mode === "month") {
      csv += "รหัสนักศึกษา,ชื่อ-นามสกุล,สถานะ,ยอด(บาท)\n";
      sorted.forEach((s) => {
        const st = { paid: "จ่ายแล้ว", unpaid: "ค้างจ่าย", pending: "รอตรวจ", future: "-" }[s.pays[mi]];
        csv += `${s.id},${s.name},${st},${s.pays[mi] === "paid" ? FM.MONTHLY_FEE : 0}\n`;
      });
    } else {
      csv += "รหัสนักศึกษา,ชื่อ-นามสกุล," + FM.months.map((m) => m.short).join(",") + ",รวมที่จ่าย(บาท)\n";
      sorted.forEach((s) => {
        const cells = s.pays.map((p) => (p === "paid" ? "จ่าย" : p === "unpaid" ? "ค้าง" : p === "pending" ? "รอตรวจ" : "-"));
        const sum = s.pays.filter((p) => p === "paid").length * FM.MONTHLY_FEE;
        csv += `${s.id},${s.name},${cells.join(",")},${sum}\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName + ".csv";
    a.click();
    flash("ดาวน์โหลดไฟล์ Excel (.csv) แล้ว");
  };

  const totalCollected = mode === "month" ? cm.paid * FM.MONTHLY_FEE
    : FM.monthlyCollected.reduce((a, b) => a + (b || 0), 0);

  const expBtns = [
    { k: "png", label: "รูปภาพ / PNG", ic: "image", fn: exportPNG, primary: true },
    { k: "pdf", label: "PDF", ic: "file", fn: exportPDF, primary: true },
    { k: "sheet", label: "Google Sheet", ic: "sheet", fn: () => flash("กำลังเชื่อมต่อ Google Sheet… (เดโม)"), primary: false },
    { k: "excel", label: "Excel (.csv)", ic: "sheet", fn: exportExcel, primary: false },
  ];

  return (
    <div>
      {/* controls */}
      <div className="card card-pad reveal row between wrap gap16" style={{ marginBottom: 18 }}>
        <div className="row gap12 wrap">
          <div className="seg">
            <button className={mode === "month" ? "on" : ""} onClick={() => setMode("month")}>รายเดือน</button>
            <button className={mode === "year" ? "on" : ""} onClick={() => setMode("year")}>รายปีการศึกษา</button>
          </div>
          {mode === "month" && (
            <div className="copy-field" style={{ padding: "8px 12px" }}>
              <Icon name="calendar" size={16} className="muted" />
              <select value={mi} onChange={(e) => setMi(+e.target.value)}
                style={{ border: "none", background: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600 }}>
                {FM.months.map((m, i) => i <= FM.currentMonthIndex && <option key={m.key} value={i}>{m.full}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="row gap8 wrap">
          {expBtns.map((b) => (
            <button key={b.k} className={"btn btn-sm " + (b.primary ? "btn-primary" : "btn-ghost")}
              disabled={!!busy} onClick={b.fn}>
              {busy === b.k ? <Icon name="refresh" size={15} className="spin" /> : <Icon name={b.ic} size={15} stroke={2.2} />}
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* preview note */}
      <div className="row gap8 muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>
        <Icon name="image" size={15} /> ตัวอย่างรายงานที่จะถูกส่งออก — PNG &amp; PDF ดาวน์โหลดได้จริง
      </div>

      {/* ======= Captured report ======= */}
      <div style={{ overflow: "auto" }}>
        <div ref={ref} style={{ background: "#fff", borderRadius: 18, border: "1px solid #E7E5DE",
          padding: 34, minWidth: 640, maxWidth: 760, margin: "0 auto", color: "#16181D" }}>
          {/* header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #16181D", paddingBottom: 18 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "#0B5FFF", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, fontFamily: "var(--num)" }}>67</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>กองทุนรุ่น 67</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 14, letterSpacing: "-.01em" }}>
                {mode === "month" ? "สรุปการชำระรายเดือน · " + FM.months[mi].full : "สรุปการชำระประจำปีการศึกษา 2569"}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11.5, color: "#8A8C93", fontWeight: 600 }}>
              <div>ออกรายงาน 13 ม.ค. 2569</div>
              <div style={{ marginTop: 2 }}>{FM.fmt(FM.MONTHLY_FEE)} / คน / เดือน</div>
              <div style={{ marginTop: 2 }}>นักศึกษา {FM.students.length} คน</div>
            </div>
          </div>

          {/* stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, margin: "20px 0 24px" }}>
            {[["ยอดเก็บได้", FM.fmt(totalCollected), "#0B5FFF"],
              ["จ่ายแล้ว", (mode === "month" ? cm.paid : Math.round(totalCollected / FM.MONTHLY_FEE / 1)) + (mode === "month" ? " คน" : " ครั้ง"), "#0E8F5B"],
              ["ค้างจ่าย", (mode === "month" ? cm.unpaid + " คน" : (FM.students.length * (FM.currentMonthIndex + 1) - Math.round(totalCollected / FM.MONTHLY_FEE)) + " ครั้ง"), "#D1453B"],
              ["คงเหลือกองทุน", FM.fmt(FM.totals.available), "#B7791F"]].map(([l, v, c]) => (
              <div key={l} style={{ background: "#FAF9F6", border: "1px solid #E7E5DE", borderRadius: 12, padding: "13px 14px" }}>
                <div style={{ fontSize: 11.5, color: "#54565E", fontWeight: 600 }}>{l}</div>
                <div style={{ fontFamily: "var(--num)", fontSize: 19, fontWeight: 700, marginTop: 5, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* table */}
          {mode === "month" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#F4F3EF" }}>
                  <th style={cellHd}>#</th><th style={cellHd}>รหัสนักศึกษา</th><th style={cellHd}>ชื่อ-นามสกุล</th>
                  <th style={{ ...cellHd, textAlign: "center" }}>สถานะ</th><th style={{ ...cellHd, textAlign: "right" }}>ยอด</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const st = s.pays[mi];
                  const meta = { paid: ["จ่ายแล้ว", "#0E8F5B"], unpaid: ["ค้างจ่าย", "#D1453B"], pending: ["รอตรวจ", "#B7791F"], future: ["-", "#8A8C93"] }[st];
                  return (
                    <tr key={s.id}>
                      <td style={{ ...cell, color: "#8A8C93", fontFamily: "var(--num)" }}>{i + 1}</td>
                      <td style={{ ...cell, fontFamily: "var(--num)", fontWeight: 600 }}>{s.id}</td>
                      <td style={{ ...cell, fontWeight: 600 }}>{s.name}</td>
                      <td style={{ ...cell, textAlign: "center", color: meta[1], fontWeight: 700 }}>{meta[0]}</td>
                      <td style={{ ...cell, textAlign: "right", fontFamily: "var(--num)", fontWeight: 600 }}>{st === "paid" ? FM.fmt(FM.MONTHLY_FEE) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#F4F3EF" }}>
                  <th style={cellHd}>รหัส</th><th style={cellHd}>ชื่อ</th>
                  {FM.months.map((m) => <th key={m.key} style={{ ...cellHd, textAlign: "center", padding: "9px 4px" }}>{m.short}</th>)}
                  <th style={{ ...cellHd, textAlign: "right" }}>รวม</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const sum = s.pays.filter((p) => p === "paid").length * FM.MONTHLY_FEE;
                  return (
                    <tr key={s.id}>
                      <td style={{ ...cell, fontFamily: "var(--num)", fontWeight: 600 }}>{s.id.slice(-3)}</td>
                      <td style={{ ...cell, fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                      {s.pays.map((p, i) => (
                        <td key={i} style={{ ...cell, textAlign: "center", padding: "7px 4px",
                          color: p === "paid" ? "#0E8F5B" : p === "unpaid" ? "#D1453B" : "#C9C7BF", fontWeight: 700 }}>
                          {p === "paid" ? "✓" : p === "unpaid" ? "✕" : p === "pending" ? "◔" : "·"}
                        </td>
                      ))}
                      <td style={{ ...cell, textAlign: "right", fontFamily: "var(--num)", fontWeight: 700 }}>{FM.fmtNum(sum)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 14, borderTop: "1px solid #E7E5DE", fontSize: 11, color: "#8A8C93" }}>
            <span>ผู้จัดทำ: ปาณิสรา รัตนพร (เหรัญญิก)</span>
            <span>ระบบกองทุนรุ่น · ตรวจสอบสลิปด้วย AI</span>
          </div>
        </div>
      </div>

      <Toast msg={toast} />
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
const cellHd = { textAlign: "left", padding: "9px 8px", fontSize: 11, color: "#54565E", fontWeight: 700, borderBottom: "1px solid #D9D7CF" };
const cell = { padding: "8px 8px", borderBottom: "1px solid #EFEEE9" };

Object.assign(window, { ExportView });
