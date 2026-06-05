"use client";

import { useState, useCallback } from "react";

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  { label: "Tier A",        minGross: 7500,    minNet: 3000,   maxItemValue: 3,  maxQty: 5,  special: false },
  { label: "Tier B",        minGross: 15000,   minNet: 6000,   maxItemValue: 3,  maxQty: 10, special: false },
  { label: "Tier C",        minGross: 22500,   minNet: 9000,   maxItemValue: 3,  maxQty: 15, special: false },
  { label: "Tier 1",        minGross: 30000,   minNet: 12000,  maxItemValue: 3,  maxQty: 20, special: false },
  { label: "Tier 2",        minGross: 100000,  minNet: 40000,  maxItemValue: 10, maxQty: 25, special: false },
  { label: "Tier 3",        minGross: 250000,  minNet: 100000, maxItemValue: 20, maxQty: 30, special: false },
  { label: "Special (500K)",minGross: 500000,  minNet: 200000, maxItemValue: 0,  maxQty: 0,  special: true  },
  { label: "Special (1M)",  minGross: 1000000, minNet: 400000, maxItemValue: 0,  maxQty: 0,  special: true  },
];

type Tier = typeof TIERS[0];

function getTier(gross: number, net: number): Tier | null {
  let matched: Tier | null = null;
  for (const t of TIERS) {
    if (gross >= t.minGross && net >= t.minNet) matched = t;
  }
  return matched;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Item = { id: number; name: string; qty: string; unitValue: string };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
let nid = 2;

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────
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

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SH({ num, icon, title }: { num: string; icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-600">{num}</div>
      <h2 className="font-semibold text-gray-800 text-sm">{icon} {title}</h2>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "Pass")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">✅ Pass</span>;
  if (status === "Over Limit")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">❌ Over Limit</span>;
  if (status === "Special Approval Required")
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">⭐ Special Approval Required</span>;
  return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">— กรอกข้อมูลให้ครบ</span>;
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function MerchandisePage() {
  // IB Details
  const [ibName,  setIbName]  = useState("");
  const [ibEmail, setIbEmail] = useState("");
  const [uid,     setUid]     = useState("");

  // Performance Period
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo,   setPeriodTo]   = useState("");

  // Performance numbers
  const [grossDep, setGrossDep] = useState("");
  const [withdraw, setWithdraw] = useState("");

  // Items
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "", qty: "", unitValue: "" }]);

  const [copied, setCopied] = useState(false);

  // ── Calculations ───────────────────────────────────────────────────────────
  const totalGross    = parseFloat(grossDep) || 0;
  const totalWithdraw = parseFloat(withdraw) || 0;
  const netDeposit    = totalGross - totalWithdraw;
  const tier          = getTier(totalGross, netDeposit);

  const totalQty   = items.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
  const totalValue = items.reduce((s, i) => s + (parseInt(i.qty) || 0) * (parseFloat(i.unitValue) || 0), 0);

  // Status check
  function getStatus(): string {
    if (!tier) return "";
    if (tier.special) return "Special Approval Required";
    const overQty   = totalQty   > tier.maxQty;
    const overValue = items.some(i => (parseFloat(i.unitValue) || 0) > tier.maxItemValue);
    if (overQty || overValue) return "Over Limit";
    if (totalQty > 0) return "Pass";
    return "";
  }
  const status = getStatus();

  // ── Item helpers ───────────────────────────────────────────────────────────
  const addItem    = () => setItems(p => [...p, { id: nid++, name: "", qty: "", unitValue: "" }]);
  const removeItem = (id: number) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: number, k: keyof Item, v: string) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));

  // ── Email builder ──────────────────────────────────────────────────────────
  const buildEmail = useCallback(() => {
    const tierLabel = tier
      ? tier.special
        ? `${tier.label} — Special Approval Required`
        : tier.label
      : "ไม่เข้าเกณฑ์ (Below Tier A)";

    const tierReqGross = tier ? `${fmt(tier.minGross, 0)} USD` : "-";
    const tierReqNet   = tier ? `${fmt(tier.minNet, 0)} USD` : "-";
    const tierMaxVal   = tier ? (tier.special ? "พิจารณาพิเศษ" : `≤ ${tier.maxItemValue} USD`) : "-";
    const tierMaxQty   = tier ? (tier.special ? "พิจารณาพิเศษ" : `${tier.maxQty} pcs`) : "-";

    const itemLines = items
      .filter(i => i.name || i.qty)
      .map((i, idx) => {
        const qty   = parseInt(i.qty)        || 0;
        const price = parseFloat(i.unitValue) || 0;
        const total = qty * price;
        return `  ${idx + 1}. ${i.name || "-"}  |  ${qty} pcs × $${fmt(price)}  =  $${fmt(total)}`;
      }).join("\n");

    const statusLine = status || "-";

    return `Subject: IB Merchandise Support Request - ${ibName || "[IB Name]"} | UID: ${uid || "[UID]"}

Dear MTK TH,

I would like to request approval for merchandise support for the following IB.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB Name  : ${ibName || "-"}
IB Email : ${ibEmail || "-"}
UID      : ${uid || "-"}

Purpose:
To support the IB's client acquisition, branding activities, seminars, community engagement, and ongoing marketing efforts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period           : ${fmtDate(periodFrom)} – ${fmtDate(periodTo)}
Total Deposit    : ${fmt(totalGross)} USD
Total Withdraw   : ${fmt(totalWithdraw)} USD
Net Deposit      : ${fmt(netDeposit)} USD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MERCHANDISE ELIGIBILITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eligible Tier             : ${tierLabel}
Gross Deposit Requirement : ${tierReqGross}
Net Deposit Requirement   : ${tierReqNet}
Maximum Item Value        : ${tierMaxVal}
Maximum Quantity          : ${tierMaxQty}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUESTED MERCHANDISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemLines || "  (ยังไม่ได้กรอกรายการ)"}

Total Requested Quantity : ${totalQty} pcs
Total Requested Value    : $${fmt(totalValue)} USD
Status                   : ${statusLine}

Best regards,
Sales Agent`;
  }, [ibName, ibEmail, uid, periodFrom, periodTo, totalGross, totalWithdraw, netDeposit, tier, items, totalQty, totalValue, status]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setIbName(""); setIbEmail(""); setUid("");
    setPeriodFrom(""); setPeriodTo("");
    setGrossDep(""); setWithdraw("");
    setItems([{ id: 1, name: "", qty: "", unitValue: "" }]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-gray-900">IB Merchandise Reimbursement</h1>
          <p className="text-xs text-gray-400 mt-0.5">กรอกข้อมูลเพื่อขอเบิกค่าของแจก (Merchandise Support)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">ล้างข้อมูล</button>
          <button onClick={handleCopy}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
            {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT ─────────────────────────────────────────────────────── */}
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
            </div>
          </div>

          {/* Section 2: IB Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="2" icon="📊" title="IB Performance" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Period From" required>
                <input type="date" className={inp} value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
              </Field>
              <Field label="Period To" required>
                <input type="date" className={inp} value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Total Deposit (Gross USD)" required>
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
                กรอก Total Deposit และ Net Deposit เพื่อดู Tier ที่เข้าเกณฑ์
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Eligible Tier",       value: tier.label,                                                       highlight: true },
                  { label: "Gross Deposit Req.",   value: `${fmt(tier.minGross, 0)} USD` },
                  { label: "Net Deposit Req.",     value: `${fmt(tier.minNet, 0)} USD` },
                  { label: "Max Item Value",       value: tier.special ? "พิจารณาพิเศษ" : `≤ $${tier.maxItemValue}` },
                  { label: "Max Quantity",         value: tier.special ? "พิจารณาพิเศษ" : `${tier.maxQty} pcs` },
                ].map(r => (
                  <div key={r.label} className={`rounded-xl p-3 text-center border ${r.highlight ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-100"}`}>
                    <p className="text-xs text-gray-400 mb-1">{r.label}</p>
                    <p className={`text-sm font-bold ${r.highlight ? "text-indigo-700" : "text-gray-700"}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Requested Merchandise */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="4" icon="🎁" title="Requested Merchandise" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 w-6">#</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-2">ชื่อของ / รายการ</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-2 w-24">จำนวน (pcs)</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-2 w-28">มูลค่า/ชิ้น (USD)</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 w-24">รวม (USD)</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const qty   = parseInt(item.qty)        || 0;
                    const price = parseFloat(item.unitValue) || 0;
                    const total = qty * price;
                    const overPrice = tier && !tier.special && price > tier.maxItemValue && price > 0;
                    return (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2 text-xs text-gray-400 pr-2">{i + 1}</td>
                        <td className="py-2 pr-2">
                          <input className={inp + " text-xs"} placeholder="เช่น เสื้อยืด, หมวก, กระเป๋า" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" className={numInp + " text-xs"} placeholder="0" min="0" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                        </td>
                        <td className="py-2 pr-2">
                          <input type="number" className={`${numInp} text-xs ${overPrice ? "border-red-300 ring-1 ring-red-200" : ""}`} placeholder="0.00" min="0" step="0.01" value={item.unitValue} onChange={e => updateItem(item.id, "unitValue", e.target.value)} />
                          {overPrice && <p className="text-xs text-red-500 mt-0.5">เกิน Max ${tier?.maxItemValue}</p>}
                        </td>
                        <td className="py-2 pr-2 text-right text-xs font-semibold text-indigo-600">${fmt(total)}</td>
                        <td className="py-2">
                          {items.length > 1 && (
                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 text-base">🗑</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={addItem} className="text-xs text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition font-medium">
              + เพิ่มรายการ
            </button>

            {/* Summary */}
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
        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">

            {/* Summary */}
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

            {/* Tier Reference Table */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-indigo-600 mb-2">ตารางเกณฑ์ Merchandise Tier</p>
              <div className="overflow-x-auto">
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
                        <td className="py-1 px-2 text-gray-700">{t.label} {tier?.label === t.label && "✓"}</td>
                        <td className="py-1 px-1 text-right text-gray-500">{t.minGross >= 1000000 ? "1M" : t.minGross >= 100000 ? (t.minGross/1000)+"K" : t.minGross.toLocaleString()}</td>
                        <td className="py-1 px-1 text-right text-gray-500">{t.minNet >= 100000 ? (t.minNet/1000)+"K" : t.minNet.toLocaleString()}</td>
                        <td className="py-1 px-1 text-right text-gray-500">{t.special ? "—" : `$${t.maxItemValue}`}</td>
                        <td className="py-1 px-1 text-right text-gray-500">{t.special ? "—" : `${t.maxQty}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

            {/* Tips */}
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2">คำแนะนำ</p>
              {["กรอกข้อมูลให้ครบทุกช่องที่มี *","ตรวจสอบ Tier ก่อนกรอกรายการของ","มูลค่าต่อชิ้นต้องไม่เกินตาม Tier", 'กด "คัดลอกข้อความอีเมล" แล้ววางในอีเมลได้เลย'].map((t, i) => (
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
