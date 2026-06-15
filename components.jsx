/* ============================================================
   Shared design-system primitives, icons and hooks.
   Exports to window at the bottom.
   ============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ----------------------------- Icons ----------------------------- */
const ICONS = {
  home: "M3 10.5 12 3l9 7.5 M5 9.5V21h14V9.5 M9.5 21v-6h5v6",
  wallet: "M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5 M3 7.5V18a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3 M21 11h-4.5a2 2 0 0 0 0 4H21v-4Z",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4 M15 4.2a3.5 3.5 0 0 1 0 6.6",
  shield: "M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9Z M9 12l2 2 4-4",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  download: "M12 3v12 M7 11l5 4 5-4 M5 21h14",
  check: "M5 12.5 10 17.5 19.5 7",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M8.5 12.2l2.4 2.4 4.6-5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7.5V12l3 2",
  alert: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 8v5 M12 16.5h.01",
  x: "M6 6l12 12 M18 6 6 18",
  copy: "M9 9h10v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  qr: "M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h2v2h-2Z M18 14h2v2h-2Z M14 18h2v2h-2Z M18 18h2v2h-2Z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3 M16 4h3a1 1 0 0 1 1 1v3 M20 16v3a1 1 0 0 1-1 1h-3 M8 20H5a1 1 0 0 1-1-1v-3 M3.5 12h17",
  sparkle: "M12 3l1.8 5.6L19.5 10l-5.7 1.4L12 17l-1.8-5.6L4.5 10l5.7-1.4Z M19 15l.7 2 .8.0 M5 4l.6 1.7",
  spark2: "M12 3l1.8 5.6L19.5 10l-5.7 1.4L12 17l-1.8-5.6L4.5 10l5.7-1.4Z",
  chevR: "M9 5l7 7-7 7",
  chevL: "M15 5l-7 7 7 7",
  chevDown: "M5 9l7 7 7-7",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M20 21l-4-4",
  filter: "M3 5h18 M6 12h12 M10 19h4",
  arrowUp: "M7 17 17 7 M9 7h8v8",
  arrowDown: "M7 7l10 10 M17 9v8H9",
  bank: "M3 9.5 12 4l9 5.5 M5 10v8 M10 10v8 M14 10v8 M19 10v8 M3 21h18",
  plus: "M12 5v14 M5 12h14",
  calendar: "M7 3v3 M17 3v3 M4 8.5h16 M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  file: "M14 3v5h5 M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z",
  image: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3 M5 18l5-5 3 3 3-3 3 3",
  sheet: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z M4 10h16 M4 15h16 M10 5v14 M16 5v14",
  external: "M14 4h6v6 M20 4l-8 8 M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
  logout: "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4 M16 17l5-5-5-5 M21 12H9",
  refresh: "M20 11A8 8 0 0 0 6.3 6.3L3 9 M3 4v5h5 M4 13a8 8 0 0 0 13.7 4.7L21 15 M21 20v-5h-5",
  upload: "M12 16V4 M7 9l5-5 5 5 M5 20h14",
  trend: "M3 17l6-6 4 4 8-8 M21 7v5h-5",
  receipt: "M6 3h12a1 1 0 0 1 1 1v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V4a1 1 0 0 1 1-1Z M9 8h6 M9 12h6",
  dot: "M12 12h.01",
  star: "M12 4l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 9.3l5-.7Z",
  pie: "M12 3v9h9 M12 21a9 9 0 1 0-9-9",
};

function Icon({ name, size = 20, stroke = 2, fill = "none", className = "", style = {} }) {
  const d = ICONS[name] || ICONS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" className={className}
      style={{ flexShrink: 0, ...style }} aria-hidden="true">
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? seg : "M" + seg)} />
      ))}
    </svg>
  );
}

/* ----------------------------- Hooks ----------------------------- */
// animated count-up
function useCountUp(target, deps = [], dur = 900) {
  const [val, setVal] = useState(target); // start at target so frozen/hidden frames are correct
  useEffect(() => {
    // if the document is hidden, rAF is paused — just show the final value
    if (typeof document !== "undefined" && document.hidden) { setVal(target); return; }
    let raf, start;
    setVal(0);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setVal(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
      else setVal(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, deps);
  return val;
}

// reveal-on-mount stagger
function useMounted(delay = 0) {
  const [on, setOn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t); }, [delay]);
  return on;
}

/* ----------------------------- Atoms ----------------------------- */
function Badge({ status, children, size = "md" }) {
  const map = {
    paid: { bg: "var(--ok-bg)", fg: "var(--ok)", label: "จ่ายแล้ว", icon: "check" },
    unpaid: { bg: "var(--bad-bg)", fg: "var(--bad)", label: "ค้างจ่าย", icon: "alert" },
    pending: { bg: "var(--warn-bg)", fg: "var(--warn)", label: "รอตรวจ", icon: "clock" },
    future: { bg: "var(--mut-bg)", fg: "var(--mut)", label: "ยังไม่ถึง", icon: "dot" },
    match: { bg: "var(--ok-bg)", fg: "var(--ok)", label: "ตรงกัน", icon: "checkCircle" },
    amount_mismatch: { bg: "var(--warn-bg)", fg: "var(--warn)", label: "ยอดไม่ตรง", icon: "alert" },
    duplicate: { bg: "var(--bad-bg)", fg: "var(--bad)", label: "สลิปซ้ำ", icon: "alert" },
  };
  const c = map[status] || map.future;
  return (
    <span className={"badge " + (size === "sm" ? "badge-sm" : "")}
      style={{ background: c.bg, color: c.fg }}>
      <Icon name={c.icon} size={size === "sm" ? 12 : 14} stroke={2.4} />
      {children || c.label}
    </span>
  );
}

function StatusDot({ status, label }) {
  const map = {
    paid: "var(--ok)", unpaid: "var(--bad)", pending: "var(--warn)", future: "var(--line2)",
  };
  return (
    <span className="sdot-wrap" title={label}>
      <span className="sdot" style={{ background: map[status] || map.future }} />
    </span>
  );
}

// progress ring
function Ring({ value, size = 120, stroke = 12, color = "var(--brand)", track = "var(--line)", children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mounted = useMounted(120);
  const off = c * (1 - (mounted ? value : 0));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

function Avatar({ name, hue = 220, size = 40 }) {
  const initials = (name || "?").trim().slice(0, 1);
  return (
    <span className="avatar" style={{
      width: size, height: size, fontSize: size * 0.42,
      background: `oklch(0.92 0.06 ${hue})`, color: `oklch(0.42 0.13 ${hue})`,
    }}>{initials}</span>
  );
}

// faux-realistic QR built from a seeded matrix (safe, no external lib)
function QRCode({ text = "promptpay", size = 188 }) {
  const cells = 29;
  const matrix = useMemo(() => {
    let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    const rng = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return (h >> 8) / 0x7fffff; };
    const m = Array.from({ length: cells }, () => Array(cells).fill(0));
    const finder = (r, c) => {
      for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j;
        if (rr < 0 || cc < 0 || rr >= cells || cc >= cells) continue;
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[rr][cc] = (edge || core) ? 1 : (i >= 0 && i <= 6 && j >= 0 && j <= 6 ? 0 : m[rr][cc]);
      }
    };
    for (let r = 0; r < cells; r++) for (let c = 0; c < cells; c++) m[r][c] = rng() > 0.5 ? 1 : 0;
    finder(0, 0); finder(0, cells - 7); finder(cells - 7, 0);
    // timing
    for (let i = 8; i < cells - 8; i++) { m[6][i] = i % 2 === 0 ? 1 : 0; m[i][6] = i % 2 === 0 ? 1 : 0; }
    return m;
  }, [text]);
  const cs = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="qr-svg">
      <rect width={size} height={size} fill="#fff" />
      {matrix.map((row, r) => row.map((v, c) => v ? (
        <rect key={r + "-" + c} x={c * cs} y={r * cs} width={cs} height={cs} rx={cs * 0.22} fill="#0b0d12" />
      ) : null))}
    </svg>
  );
}

function Sheet({ open, onClose, children, title, maxW = 460 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-card" style={{ maxWidth: maxW }} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="ปิด"><Icon name="x" size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast"><Icon name="checkCircle" size={18} stroke={2.2} />{msg}</div>;
}

Object.assign(window, {
  Icon, Badge, StatusDot, Ring, Avatar, QRCode, Sheet, Toast,
  useCountUp, useMounted,
  useState, useEffect, useRef, useMemo, useCallback,
});
