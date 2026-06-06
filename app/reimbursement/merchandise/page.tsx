"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── TIER CONFIG ──────────────────────────────────────────────────────────────
const TIERS = [
  { label: "Tier A",         minGross: 7500,    minNet: 3000,   maxItemValue: 3,  maxQty: 5,  special: false },
  { label: "Tier B",         minGross: 15000,   minNet: 6000,   maxItemValue: 3,  maxQty: 10, special: false },
  { label: "Tier C",         minGross: 22500,   minNet: 9000,   maxItemValue: 3,  maxQty: 15, special: false },
  { label: "Tier 1",         minGross: 30000,   minNet: 12000,  maxItemValue: 3,  maxQty: 20, special: false },
  { label: "Tier 2",         minGross: 100000,  minNet: 40000,  maxItemValue: 10, maxQty: 25, special: false },
  { label: "Tier 3",         minGross: 250000,  minNet: 100000, maxItemValue: 20, maxQty: 30, special: false },
  { label: "Special (500K)", minGross: 500000,  minNet: 200000, maxItemValue: 0,  maxQty: 0,  special: true  },
  { label: "Special (1M)",   minGross: 1000000, minNet: 400000, maxItemValue: 0,  maxQty: 0,  special: true  },
];

// ─── PRESET ITEMS ────────────────────────────────────────────────────────────
const PRESET_ITEMS = [
  { name: "Mouse Pad",       price: 5,   hasSize: false },
  { name: "Umbrella",        price: 3,   hasSize: false },
  { name: "T-Shirt",         price: 5,   hasSize: true  },
  { name: "Notebook",        price: 3,   hasSize: false },
  { name: "Mug",             price: 3,   hasSize: false },
  { name: "Pen",             price: 1,   hasSize: false },
  { name: "Roll Up Banner",  price: 40,  hasSize: false },
  { name: "Backdrop",        price: 350, hasSize: false },
];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type Tier = typeof TIERS[0];
type Item = { id: number; name: string; size: string; qty: string; unitValue: number };

function getTier(gross: number, net: number): Tier | null {
  let matched: Tier | null = null;
  for (const t of TIERS) {
    if (gross >= t.minGross && net >= t.minNet) matched = t;
  }
  return matched;
}

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
let nid = 2;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white placeholder-gray-300";
const numInp = inp + " text-right";

function SH({ num, icon, title }: { num: string; icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600">{num}</div>
      <h2 className="font-semibold text-gray-800 text-sm">{icon} {title}</h2>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Pass")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">✅ Pass</span>;
  if (status === "Over Limit")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">❌ Over Limit</span>;
  if (status === "Special Approval Required")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">⭐ Special Approval Required</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">— กรอกข้อมูลให้ครบ</span>;
}

export default function MerchandisePage() {
  const router = useRouter();
  // IB Details
  const [ibName,        setIbName]        = useState("");
  const [ibEmail,       setIbEmail]       = useState("");
  const [uid,           setUid]           = useState("");
  const [registerDate,  setRegisterDate]  = useState("");

  // Performance Period
  const now     = new Date();
  const [perfMonth, setPerfMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [perfYear,  setPerfYear]  = useState(String(now.getFullYear()));

  // Performance numbers
  const [grossDep, setGrossDep] = useState("");
  const [withdraw, setWithdraw] = useState("");

  // Items
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "", size: "", qty: "", unitValue: 0 },
  ]);

  const [copied, setCopied] = useState(false);

  // ── Valid periods ──────────────────────────────────────────────────────────
  const validPeriods: { year: string; month: string; label: string }[] = (() => {
    const nowY = now.getFullYear();
    const nowM = now.getMonth() + 1;
    let minY = nowY, minM = nowM - 11;
    if (minM <= 0) { minY -= 1; minM += 12; }
    if (registerDate) {
      const reg = new Date(registerDate);
      let rY = reg.getFullYear(), rM = reg.getMonth() + 1 - 1;
      if (rM <= 0) { rY -= 1; rM += 12; }
      minY = rY; minM = rM;
    }
    const periods: { year: string; month: string; label: string }[] = [];
    let cy = minY, cm = minM;
    while (cy < nowY || (cy === nowY && cm <= nowM)) {
      periods.push({ year: String(cy), month: String(cm).padStart(2, "0"), label: `${MONTH_NAMES[cm - 1]} ${cy}` });
      cm++; if (cm > 12) { cm = 1; cy++; }
    }
    return periods;
  })();

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalGross    = parseFloat(grossDep) || 0;
  const totalWithdraw = parseFloat(withdraw) || 0;
  const netDeposit    = totalGross - totalWithdraw;
  const tier          = getTier(totalGross, netDeposit);
  const totalQty      = items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
  const totalValue    = items.reduce((s, i) => s + (parseInt(i.qty) || 0) * i.unitValue, 0);

  function getStatus(): string {
    if (!tier) return "";
    if (tier.special) return "Special Approval Required";
    const overQty   = totalQty > tier.maxQty;
    const overValue = items.some(i => i.unitValue > tier.maxItemValue && i.unitValue > 0);
    if (overQty || overValue) return "Over Limit";
    if (totalQty > 0) return "Pass";
    return "";
  }
  const status = getStatus();

  // ── Item helpers ──────────────────────────────────────────────────────────
  const addItem    = () => setItems(p => [...p, { id: nid++, name: "", size: "", qty: "", unitValue: 0 }]);
  const removeItem = (id: number) => setItems(p => p.filter(i => i.id !== id));
  const updateItemName = (id: number, name: string) => {
    const preset = PRESET_ITEMS.find(p => p.name === name);
    setItems(p => p.map(i => i.id === id ? { ...i, name, unitValue: preset?.price ?? 0, size: "" } : i));
  };
  const updateItem = (id: number, k: keyof Item, v: string | number) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));

  // ── Email builder ─────────────────────────────────────────────────────────
  const buildEmail = useCallback(() => {
    const tierLabel  = tier ? (tier.special ? `${tier.label} — Special Approval Required` : tier.label) : "ไม่เข้าเกณฑ์ (Below Tier A)";
    const periodLabel = validPeriods.find(p => p.year === perfYear && p.month === perfMonth)?.label || `${MONTH_NAMES[parseInt(perfMonth)-1]} ${perfYear}`;
    const itemLines  = items.filter(i => i.name || i.qty).map((i, idx) => {
      const qty = parseInt(i.qty) || 0;
      const sizeLabel = i.size ? ` (Size: ${i.size})` : "";
      return `  ${idx + 1}. ${i.name || "-"}${sizeLabel} — ${qty} pcs`;
    }).join("\n");

    return `Subject: IB Merchandise Support Request - ${ibName || "[IB Name]"} | UID: ${uid || "[UID]"}

Dear MTK TH,

I would like to request approval for merchandise support for the following IB.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB Name        : ${ibName || "-"}
IB Email       : ${ibEmail || "-"}
UID            : ${uid || "-"}
Register Date  : ${fmtDate(registerDate)}

Purpose:
To support the IB's client acquisition, branding activities, seminars, community engagement, and ongoing marketing efforts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period           : ${periodLabel}
Total Deposit    : ${fmt(totalGross)} USD
Total Withdraw   : ${fmt(totalWithdraw)} USD
Net Deposit      : ${fmt(netDeposit)} USD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MERCHANDISE ELIGIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eligible Tier             : ${tierLabel}
Gross Deposit Requirement : ${tier ? fmt(tier.minGross, 0) + " USD" : "-"}
Net Deposit Requirement   : ${tier ? fmt(tier.minNet, 0) + " USD" : "-"}
Maximum Item Value        : ${tier ? (tier.special ? "พิจารณาพิเศษ" : `≤ $${tier.maxItemValue}`) : "-"}
Maximum Quantity          : ${tier ? (tier.special ? "พิจารณาพิเศษ" : `${tier.maxQty} pcs`) : "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUESTED MERCHANDISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemLines || "  (ยังไม่ได้กรอกรายการ)"}

Total Requested Quantity : ${totalQty} pcs
Total Requested Value    : $${fmt(totalValue)} USD
Status                   : ${status || "-"}

Attachment: CRM Deposit/Withdraw Report Screenshot

Best regards,
Sales Agent`;
  }, [ibName, ibEmail, uid, registerDate, perfMonth, perfYear, totalGross, totalWithdraw, netDeposit, tier, items, totalQty, totalValue, status, validPeriods]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setIbName(""); setIbEmail(""); setUid(""); setRegisterDate("");
    setGrossDep(""); setWithdraw("");
    setItems([{ id: 1, name: "", size: "", qty: "", unitValue: 0 }]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/reimbursement")} className="flex items-center gap-2.5 hover:opacity-75 transition cursor-pointer bg-transparent border-none p-0">
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#1e1b2e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-900 leading-tight">IB Reimbursement</div>
              <div className="text-xs text-gray-400">Support Teambon VT Market</div>
            </div>
          </button>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">ล้างข้อมูล</button>
            <button onClick={handleCopy}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="px-6 flex gap-1 border-t border-gray-100">
          <button
            onClick={() => router.push("/reimbursement/ads")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            📢 เบิกค่า Ads
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 bg-white -mb-px">
            🎁 เบิกของรางวัล
          </button>
          <button onClick={() => router.push("/reimbursement/personal")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            💰 เบิกเงินส่วนตัว
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Section 1: IB Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="1" icon="👤" title="IB Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="IB Name" required>
                <input className={inp} placeholder="ชื่อ IB" value={ibName} onChange={e => setIbName(e.target.value)} />
              </Field>
              <Field label="IB Email" required>
                <input type="email" className={inp} placeholder="email@example.com" value={ibEmail} onChange={e => setIbEmail(e.target.value)} />
              </Field>
              <Field label="UID" required>
                <input className={inp} placeholder="กรอก UID" value={uid} onChange={e => setUid(e.target.value)} />
              </Field>
              <Field label="Register Date" required>
                <input type="date" className={inp} value={registerDate} onChange={e => setRegisterDate(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 2: IB Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header with period selector */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600">2</div>
                <h2 className="font-semibold text-gray-800 text-sm">📊 IB Performance</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Period:</span>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  value={`${perfYear}-${perfMonth}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split("-");
                    setPerfYear(y); setPerfMonth(m);
                  }}
                >
                  {validPeriods.length === 0 && <option value="">— กรอก Register Date ก่อน —</option>}
                  {validPeriods.map(p => (
                    <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>{p.label}</option>
                  ))}
                </select>
                {registerDate && (
                  <span className="text-xs text-indigo-400">
                    (นับจาก {new Date(registerDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })})
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Deposit / Gross (USD)" required>
                <input type="number" className={numInp} placeholder="0.00" min="0" value={grossDep} onChange={e => setGrossDep(e.target.value)} />
              </Field>
              <Field label="Total Withdraw (USD)">
                <input type="number" className={numInp} placeholder="0.00" min="0" value={withdraw} onChange={e => setWithdraw(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Net Deposit (USD)</p>
                <p className="text-xs text-gray-400">Total Deposit − Total Withdraw</p>
              </div>
              <p className={`text-2xl font-bold ${netDeposit < 0 ? "text-red-500" : "text-indigo-600"}`}>
                {fmt(netDeposit)} <span className="text-sm font-normal text-gray-400">USD</span>
              </p>
            </div>
          </div>

          {/* Section 3: Eligibility */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="3" icon="🏅" title="Merchandise Eligibility" />
            {!tier ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-400">
                กรอก Total Deposit เพื่อดู Tier ที่เข้าเกณฑ์
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Eligible Tier",     value: tier.label,                                                       hl: true },
                  { label: "Gross Deposit Req.", value: `${fmt(tier.minGross, 0)} USD` },
                  { label: "Net Deposit Req.",   value: `${fmt(tier.minNet, 0)} USD` },
                  { label: "Max Item Value",     value: tier.special ? "พิจารณาพิเศษ" : `≤ $${tier.maxItemValue}` },
                  { label: "Max Quantity",       value: tier.special ? "พิจารณาพิเศษ" : `${tier.maxQty} pcs` },
                ].map(r => (
                  <div key={r.label} className={`rounded-xl p-3 text-center border ${r.hl ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100"}`}>
                    <p className="text-xs text-gray-400 mb-1">{r.label}</p>
                    <p className={`text-sm font-bold ${r.hl ? "text-indigo-700" : "text-gray-700"}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Requested Merchandise */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="4" icon="🎁" title="Requested Merchandise" />

            {/* Preset price reference */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-indigo-700 mb-2">ราคาของรางวัล (USD)</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ITEMS.map(p => (
                  <span key={p.name} className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-full">
                    {p.name} ${p.price}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => {
                const qty   = parseInt(item.qty) || 0;
                const total = qty * item.unitValue;
                const overPrice = tier && !tier.special && item.unitValue > tier.maxItemValue && item.unitValue > 0;
                const preset = PRESET_ITEMS.find(p => p.name === item.name);
                return (
                  <div key={item.id} className={`border rounded-xl p-3 ${overPrice ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400 font-medium w-4">{i + 1}.</span>
                      <select
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                        value={item.name}
                        onChange={e => updateItemName(item.id, e.target.value)}
                      >
                        <option value="">— เลือกของรางวัล —</option>
                        {PRESET_ITEMS.map(p => (
                          <option key={p.name} value={p.name}>{p.name} (${p.price})</option>
                        ))}
                      </select>
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-base ml-1">🗑</button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      {preset?.hasSize && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">Size:</span>
                          <select
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            value={item.size}
                            onChange={e => updateItem(item.id, "size", e.target.value)}
                          >
                            <option value="">เลือก Size</option>
                            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">จำนวน:</span>
                        <input
                          type="number" min="0"
                          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                          placeholder="0" value={item.qty}
                          onChange={e => updateItem(item.id, "qty", e.target.value)}
                        />
                        <span className="text-xs text-gray-400">pcs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">ราคา/ชิ้น:</span>
                        <span className={`text-xs font-semibold ${overPrice ? "text-red-500" : "text-indigo-600"}`}>${fmt(item.unitValue)}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-xs text-gray-400">รวม:</span>
                        <span className="text-xs font-bold text-gray-700">${fmt(total)}</span>
                      </div>
                    </div>
                    {overPrice && (
                      <p className="text-xs text-red-500 pl-6 mt-1">⚠️ ราคาเกิน Max ${tier?.maxItemValue} ตาม {tier?.label}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={addItem} className="mt-3 text-xs text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition font-medium">
              + เพิ่มรายการ
            </button>

            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Requested Quantity</span>
                <span className={`font-bold ${tier && !tier.special && totalQty > tier.maxQty ? "text-red-500" : "text-gray-800"}`}>
                  {totalQty} pcs {tier && !tier.special && totalQty > tier.maxQty && `(เกิน max ${tier.maxQty} pcs)`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Requested Value</span>
                <span className="font-bold text-gray-800">${fmt(totalValue)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100">
                <span className="font-semibold text-gray-700">Status</span>
                <StatusBadge status={status} />
              </div>
            </div>
          </div>

          {/* Section 5: Attachment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="5" icon="📎" title="Attachments (แนบไฟล์หลักฐาน)" />
            <div className="border border-dashed border-gray-200 rounded-xl p-5 text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm font-semibold text-gray-700 mb-1">CRM Deposit/Withdraw Report</p>
              <p className="text-xs text-gray-400 mb-3">แนบไฟล์รายงานยอดฝาก/ถอนจาก CRM</p>
              <p className="text-xs text-gray-300">รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)</p>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">* แนบไฟล์ในอีเมลเมื่อส่งจริง</p>
          </div>
        </div>

        {/* ── RIGHT ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-semibold text-gray-700 text-sm mb-4">📋 สรุปการขอเบิก</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Total Deposit (Gross)</span><span>{fmt(totalGross)} USD</span></div>
              <div className="flex justify-between text-gray-600"><span>Total Withdraw</span><span>{fmt(totalWithdraw)} USD</span></div>
              <div className="flex justify-between font-bold text-gray-800 border-t pt-2"><span>Net Deposit</span><span className={netDeposit < 0 ? "text-red-500" : ""}>{fmt(netDeposit)} USD</span></div>
              <div className="flex justify-between text-gray-600 pt-1"><span>Eligible Tier</span><span className="font-semibold text-indigo-600">{tier?.label || "-"}</span></div>
              <div className="flex justify-between text-gray-600"><span>Max Item Value</span><span>{tier ? (tier.special ? "พิจารณาพิเศษ" : `≤ $${tier.maxItemValue}`) : "-"}</span></div>
              <div className="flex justify-between text-gray-600"><span>Max Quantity</span><span>{tier ? (tier.special ? "พิจารณาพิเศษ" : `${tier.maxQty} pcs`) : "-"}</span></div>
              <div className="flex justify-between text-gray-600 border-t pt-2"><span>Total Qty Requested</span><span className="font-bold">{totalQty} pcs</span></div>
              <div className="flex justify-between text-gray-600"><span>Total Value Requested</span><span className="font-bold">${fmt(totalValue)}</span></div>
              <div className="flex justify-between items-center border-t pt-2"><span className="font-semibold">Status</span><StatusBadge status={status} /></div>
            </div>

            {/* Tier table */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-indigo-600 mb-2">ตารางเกณฑ์ Merchandise Tier</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="py-1.5 px-2 text-left text-indigo-700 font-semibold">Tier</th>
                    <th className="py-1.5 px-1 text-right text-indigo-700 font-semibold">Gross</th>
                    <th className="py-1.5 px-1 text-right text-indigo-700 font-semibold">Net</th>
                    <th className="py-1.5 px-1 text-right text-indigo-700 font-semibold">Max $</th>
                    <th className="py-1.5 px-1 text-right text-indigo-700 font-semibold">Max Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map(t => (
                    <tr key={t.label} className={`border-t border-gray-100 ${tier?.label === t.label ? "bg-indigo-50 font-semibold" : ""}`}>
                      <td className="py-1 px-2 text-gray-700">{t.label}{tier?.label === t.label ? " ✓" : ""}</td>
                      <td className="py-1 px-1 text-right text-gray-500">{t.minGross >= 1000000 ? "1M" : t.minGross >= 1000 ? (t.minGross/1000)+"K" : t.minGross}</td>
                      <td className="py-1 px-1 text-right text-gray-500">{t.minNet >= 1000 ? (t.minNet/1000)+"K" : t.minNet}</td>
                      <td className="py-1 px-1 text-right text-gray-500">{t.special ? "—" : `$${t.maxItemValue}`}</td>
                      <td className="py-1 px-1 text-right text-gray-500">{t.special ? "—" : t.maxQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Email Preview */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-600 mb-2">📧 ตัวอย่างอีเมล (Preview)</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{buildEmail()}</pre>
              </div>
            </div>

            <button onClick={handleCopy}
              className={`mt-4 w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {copied ? "✅ คัดลอกข้อความแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>

            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2">คำแนะนำ</p>
              {["กรอกข้อมูลให้ครบทุกช่องที่มี *","กรอก Register Date เพื่อกำหนดช่วง Period","ตรวจสอบ Tier ก่อนเลือกของรางวัล","แนบไฟล์ CRM ในอีเมลเมื่อส่งจริง"].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
