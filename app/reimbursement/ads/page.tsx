"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
const TIERS = [
  { tier: 1, minDeposit: 50000,  minNet: 22500,  maxClaim: 10000 },
  { tier: 2, minDeposit: 100000, minNet: 45000,  maxClaim: 20000 },
  { tier: 3, minDeposit: 300000, minNet: 135000, maxClaim: 30000 },
];

function getTier(totalDeposit: number, netDeposit: number) {
  let matched = null;
  for (const t of TIERS) {
    if (totalDeposit >= t.minDeposit && netDeposit >= t.minNet) matched = t;
  }
  return matched;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type BillRow = { id: number; dueDate: string; fileName: string; amount: string };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtDate(d: string) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
let nextId = 2;

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ icon, num, title, sub }: { icon: string; num: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-600">{num}</div>
      <div>
        <h2 className="font-semibold text-gray-800 text-sm">{icon} {title}</h2>
        {sub && <p className="text-xs text-blue-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white placeholder-gray-300";
const numInp = inp + " text-right";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdsReimbursementPage() {
  const router = useRouter();
  // Client Info
  const [clientName,    setClientName]    = useState("");
  const [uid,           setUid]           = useState("");
  const [registerDate,  setRegisterDate]  = useState("");
  const [rebateAccount, setRebateAccount] = useState("");
  const [ibSocial,      setIbSocial]      = useState("");

  // Period
  const [perfMonth, setPerfMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [perfYear,  setPerfYear]  = useState(String(new Date().getFullYear()));

  // คำนวณช่วงเดือนที่เลือกได้ (Register Date - 1 เดือน → ปัจจุบัน)
  const validPeriods: { year: string; month: string; label: string }[] = (() => {
    const now = new Date();
    const nowY = now.getFullYear();
    const nowM = now.getMonth() + 1; // 1-12

    // ถ้ายังไม่ได้กรอก Register Date → แสดงย้อนหลัง 12 เดือน
    let minY = nowY;
    let minM = nowM - 11;
    if (minM <= 0) { minY -= 1; minM += 12; }

    if (registerDate) {
      const reg = new Date(registerDate);
      // ย้อนหลังได้ไม่เกิน 1 เดือนจาก Register Date
      let rY = reg.getFullYear();
      let rM = reg.getMonth() + 1 - 1; // -1 เดือน
      if (rM <= 0) { rY -= 1; rM += 12; }
      minY = rY;
      minM = rM;
    }

    const periods: { year: string; month: string; label: string }[] = [];
    const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let cy = minY, cm = minM;
    while (cy < nowY || (cy === nowY && cm <= nowM)) {
      periods.push({
        year:  String(cy),
        month: String(cm).padStart(2, "0"),
        label: `${MONTH_NAMES[cm - 1]} ${cy}`,
      });
      cm++;
      if (cm > 12) { cm = 1; cy++; }
    }
    return periods;
  })();

  // Performance
  const [depUSD, setDepUSD] = useState("");
  const [depUSC, setDepUSC] = useState("");
  const [witUSD, setWitUSD] = useState("");
  const [witUSC, setWitUSC] = useState("");

  // Ads
  const [adsPlatform, setAdsPlatform] = useState("");

  // Bills
  const [bills, setBills] = useState<BillRow[]>([{ id: 1, dueDate: "", fileName: "", amount: "" }]);

  // Copy state
  const [copied, setCopied] = useState(false);

  // ── Calculations ────────────────────────────────────────────────────────────
  const totalDeposit = (parseFloat(depUSD) || 0) + (parseFloat(depUSC) || 0) / 100;
  const totalWithdraw = (parseFloat(witUSD) || 0) + (parseFloat(witUSC) || 0) / 100;
  const netDeposit = totalDeposit - totalWithdraw;
  const tier = getTier(totalDeposit, netDeposit);
  const totalBills = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const claimable = tier ? Math.min(totalBills, tier.maxClaim) : 0;

  // ── Bill helpers ─────────────────────────────────────────────────────────────
  const addBill = () => {
    setBills(p => [...p, { id: nextId++, dueDate: "", fileName: "", amount: "" }]);
  };
  const removeBill = (id: number) => setBills(p => p.filter(b => b.id !== id));
  const updateBill = (id: number, key: keyof BillRow, val: string) =>
    setBills(p => p.map(b => b.id === id ? { ...b, [key]: val } : b));

  // ── Email builder ─────────────────────────────────────────────────────────────
  const buildEmail = useCallback(() => {
    const tierLabel = tier ? `Tier ${tier.tier} (Max ${fmt(tier.maxClaim, 0)} THB)` : "ไม่เข้า Tier";
    const billLines = bills
      .filter(b => b.fileName || b.amount)
      .map((b, i) => `  ${i + 1}. ${b.fileName || "-"} | Due: ${fmtDate(b.dueDate)} | Amount: ${fmt(parseFloat(b.amount) || 0, 2)} THB`)
      .join("\n");

    return `Subject: IB reimburse advertising UID: ${uid || "[UID]"}

Dear Team,

I would like to request approval for advertising support reimbursement for the following client. The details are as follows:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client Name         : ${clientName || "-"}
UID                 : ${uid || "-"}
Register Date       : ${fmtDate(registerDate)}
Rebate Account      : ${rebateAccount || "-"}
IB Social Media     : ${ibSocial || "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE DATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period              : ${["January","February","March","April","May","June","July","August","September","October","November","December"][parseInt(perfMonth)-1]} ${perfYear}
Total Deposit (USD) : ${fmt(totalDeposit)} USD
Total Withdraw (USD): ${fmt(totalWithdraw)} USD
Net Deposit (USD)   : ${fmt(netDeposit)} USD
Eligible Tier       : ${tierLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADVERTISING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Platform            : ${adsPlatform || "-"}
Max Reimbursement   : ${tier ? fmt(tier.maxClaim, 0) + " THB" : "-"}
Total Bills         : ${fmt(totalBills, 2)} THB
Claimable Amount    : ${fmt(claimable, 2)} THB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BILL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${billLines || "  (ไม่มีบิล)"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATTACHMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CRM Deposit/Withdraw Report
2. Facebook Campaign Screenshot
3. Ads Spending Summary Screenshot

Please review and approve at your earliest convenience.

Best regards,
Sales Agent`;
  }, [clientName, uid, registerDate, rebateAccount, ibSocial, totalDeposit, totalWithdraw, netDeposit, tier, adsPlatform, totalBills, claimable, bills, perfMonth, perfYear]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setClientName(""); setUid(""); setRegisterDate(""); setRebateAccount(""); setIbSocial("");
    setDepUSD(""); setDepUSC(""); setWitUSD(""); setWitUSC("");
    setAdsPlatform("");
    setBills([{ id: 1, dueDate: "", fileName: "", amount: "" }]);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
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
            <button onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              ล้างข้อมูล
            </button>
            <button onClick={handleCopy}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="px-6 flex gap-1 border-t border-gray-100">
          <button className="px-5 py-2.5 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 bg-white -mb-px">
            📢 เบิกค่า Ads
          </button>
          <button onClick={() => router.push("/reimbursement/merchandise")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            🎁 เบิกของรางวัล
          </button>
          <button onClick={() => router.push("/reimbursement/personal")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            💰 เบิกเงินส่วนตัว
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Form ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Section 1: Client Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader icon="👤" num="1" title="Client Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Client Name" required>
                <input className={inp} placeholder="กรอกชื่อ-นามสกุลลูกค้า" value={clientName} onChange={e => setClientName(e.target.value)} />
              </Field>
              <Field label="UID" required>
                <input className={inp} placeholder="กรอก UID ของลูกค้า" value={uid} onChange={e => setUid(e.target.value)} />
              </Field>
              <Field label="Register Date" required>
                <input type="date" className={inp} value={registerDate} onChange={e => setRegisterDate(e.target.value)} />
              </Field>
              <Field label="Rebate to Payment Account" required>
                <input className={inp} placeholder="กรอกบัญชีที่รับเงินคืน" value={rebateAccount} onChange={e => setRebateAccount(e.target.value)} />
              </Field>
              <Field label="IB Social Media">
                <input className={inp} placeholder="เช่น Facebook, Line, Instagram หรือ @username" value={ibSocial} onChange={e => setIbSocial(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 2: Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-600">2</div>
                <h2 className="font-semibold text-gray-800 text-sm">📊 Performance Date</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Period:</span>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  value={`${perfYear}-${perfMonth}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split("-");
                    setPerfYear(y);
                    setPerfMonth(m);
                  }}
                >
                  {validPeriods.length === 0 && (
                    <option value="">— กรอก Register Date ก่อน —</option>
                  )}
                  {validPeriods.map(p => (
                    <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {registerDate && (
                  <span className="text-xs text-blue-400">
                    (นับจาก {new Date(registerDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })})
                  </span>
                )}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
              หมายเหตุ: ระบบจะแปลง USC เป็น USD โดยอัตโนมัติ (1 USC = 0.01 USD)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4">รายการ</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-4 w-36">USD</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-4 w-36">USC</th>
                    <th className="text-right text-xs text-blue-500 font-medium pb-2 w-36">แปลงเป็น USD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-700 font-medium">Total Deposit</td>
                    <td className="py-3 pr-4">
                      <input type="number" className={numInp} placeholder="0.00" value={depUSD} onChange={e => setDepUSD(e.target.value)} min="0" />
                    </td>
                    <td className="py-3 pr-4">
                      <input type="number" className={numInp} placeholder="0" value={depUSC} onChange={e => setDepUSC(e.target.value)} min="0" />
                    </td>
                    <td className="py-3 text-right font-semibold text-blue-600">{fmt(totalDeposit)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-gray-700 font-medium">Total Withdraw</td>
                    <td className="py-3 pr-4">
                      <input type="number" className={numInp} placeholder="0.00" value={witUSD} onChange={e => setWitUSD(e.target.value)} min="0" />
                    </td>
                    <td className="py-3 pr-4">
                      <input type="number" className={numInp} placeholder="0" value={witUSC} onChange={e => setWitUSC(e.target.value)} min="0" />
                    </td>
                    <td className="py-3 text-right font-semibold text-blue-600">{fmt(totalWithdraw)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Net Deposit (USD)</p>
                <p className="text-xs text-gray-400">Total Deposit − Total Withdraw</p>
              </div>
              <p className={`text-2xl font-bold ${netDeposit < 0 ? "text-red-500" : "text-blue-600"}`}>
                {fmt(netDeposit)} <span className="text-sm font-normal text-gray-400">USD</span>
              </p>
            </div>
          </div>

          {/* Section 3: Ads Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader icon="📢" num="3" title="Advertising Reimbursement Details" />
            <div className="space-y-4">
              <Field label="Advertising Platform" required>
                <select className={inp} value={adsPlatform} onChange={e => setAdsPlatform(e.target.value)}>
                  <option value="">เลือกแพลตฟอร์ม</option>
                  <option>Facebook</option>
                  <option>Line</option>
                  <option>Google Ads</option>
                  <option>TikTok</option>
                  <option>Instagram</option>
                  <option>Twitter / X</option>
                  <option>YouTube</option>
                  <option>Other</option>
                </select>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Tier ที่เข้าเกณฑ์</p>
                  <p className={`text-lg font-bold ${tier ? "text-blue-600" : "text-gray-400"}`}>
                    {tier ? `Tier ${tier.tier}` : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">ยอดเบิกสูงสุด</p>
                  <p className={`text-lg font-bold ${tier ? "text-blue-600" : "text-gray-400"}`}>
                    {tier ? `${fmt(tier.maxClaim, 0)} THB` : "-"}
                  </p>
                </div>
                <div className={`rounded-lg p-3 text-center border ${claimable > 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-transparent"}`}>
                  <p className="text-xs text-gray-400 mb-1">ยอดที่สามารถเบิก</p>
                  <p className={`text-lg font-bold ${claimable > 0 ? "text-green-600" : "text-gray-400"}`}>
                    {claimable > 0 ? `${fmt(claimable, 2)} THB` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Bill Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader icon="🧾" num="4" title="Bill Details (บิลค่าโฆษณา)" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 w-8">#</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-2">Due Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-2">File Name</th>
                    <th className="text-right text-xs text-gray-400 font-medium pb-2 pr-2 w-36">Amount (THB)</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b, i) => (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="py-2 text-xs text-gray-400 pr-2">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <input type="date" className={inp + " text-xs"} value={b.dueDate} onChange={e => updateBill(b.id, "dueDate", e.target.value)} />
                      </td>
                      <td className="py-2 pr-2">
                        <input className={inp + " text-xs"} placeholder="ชื่อไฟล์ เช่น FB_Ad_Mar" value={b.fileName} onChange={e => updateBill(b.id, "fileName", e.target.value)} />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" className={numInp + " text-xs"} placeholder="0.00" value={b.amount} onChange={e => updateBill(b.id, "amount", e.target.value)} min="0" />
                      </td>
                      <td className="py-2">
                        {bills.length > 1 && (
                          <button onClick={() => removeBill(b.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">🗑</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addBill} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition font-medium">
              + เพิ่มบิล
            </button>
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>รวมยอดบิลทั้งหมด</span>
                <span className="font-semibold">{fmt(totalBills, 2)} THB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={tier ? "text-green-600 font-medium" : "text-gray-400"}>ยอดที่ขอเบิก (ไม่เกินตาม Tier)</span>
                <span className={`font-bold ${tier ? "text-green-600" : "text-gray-400"}`}>{fmt(claimable, 2)} THB</span>
              </div>
            </div>
          </div>

          {/* Section 5: Attachments */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader icon="📎" num="5" title="Attachments (แนบไฟล์หลักฐาน)" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { num: 1, label: "CRM Deposit/Withdraw Report", sub: "แนบไฟล์รายงานยอดฝาก/ถอนจาก CRM" },
                { num: 2, label: "Facebook Campaign Screenshot", sub: "แนบสกรีนช็อตแคมเปญโฆษณา" },
                { num: 3, label: "Ads Spending Summary Screenshot", sub: "แนบสรุปยอดสปีนจากโฆษณาล่าสุด" },
              ].map(a => (
                <div key={a.num} className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-xs font-semibold text-gray-700 mb-1">{a.num}. {a.label}</p>
                  <p className="text-xs text-gray-400 mb-3">{a.sub}</p>
                  <p className="text-xs text-gray-300">รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">* แนบไฟล์ในอีเมลเมื่อส่งจริง</p>
          </div>
        </div>

        {/* ── RIGHT: Summary + Preview ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-semibold text-gray-700 text-sm mb-4">🧮 สรุปผลการคำนวณ</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "Total Deposit (USD)", value: fmt(totalDeposit), bold: false },
                { label: "Total Withdraw (USD)", value: fmt(totalWithdraw), bold: false },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-gray-600">
                  <span>{r.label}</span>
                  <span>{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-100 pt-2">
                <span>Net Deposit (USD)</span>
                <span className={netDeposit < 0 ? "text-red-500" : ""}>{fmt(netDeposit)}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1">
                <span>Tier ที่เข้าเกณฑ์</span>
                <span className="font-semibold text-blue-600">{tier ? `Tier ${tier.tier}` : "-"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ยอดเบิกสูงสุดตาม Tier</span>
                <span className="font-semibold">{tier ? `${fmt(tier.maxClaim, 0)} THB` : "-"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>รวมยอดบิลทั้งหมด</span>
                <span className="font-semibold">{fmt(totalBills, 2)} THB</span>
              </div>
              <div className={`flex justify-between font-bold text-base border-t border-gray-100 pt-2 ${claimable > 0 ? "text-green-600" : "text-gray-400"}`}>
                <span>ยอดที่สามารถเบิกได้</span>
                <span>{fmt(claimable, 2)} THB</span>
              </div>
            </div>

            {/* Tier table */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-blue-600 mb-2">เกณฑ์การเบิกค่าโฆษณา (Ads Fee Support)</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="py-1.5 px-2 text-left text-blue-700 font-semibold rounded-tl-lg">Tier</th>
                    <th className="py-1.5 px-2 text-right text-blue-700 font-semibold">ยอดฝากขั้นต่ำ</th>
                    <th className="py-1.5 px-2 text-right text-blue-700 font-semibold">Net Deposit</th>
                    <th className="py-1.5 px-2 text-right text-blue-700 font-semibold rounded-tr-lg">เบิกได้สูงสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map(t => (
                    <tr key={t.tier} className={`border-t border-gray-100 ${tier?.tier === t.tier ? "bg-blue-50 font-semibold" : ""}`}>
                      <td className="py-1.5 px-2 text-gray-700">Tier {t.tier} {tier?.tier === t.tier && "✓"}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{fmt(t.minDeposit, 0)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{fmt(t.minNet, 0)}</td>
                      <td className="py-1.5 px-2 text-right text-blue-600">{fmt(t.maxClaim, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-1">* ยอดเบิกไม่เกินตามที่บริษัทกำหนด</p>
            </div>

            {/* Email Preview */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600">📧 ตัวอย่างอีเมล (Preview)</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {buildEmail()}
                </pre>
              </div>
            </div>

            {/* Copy button big */}
            <button onClick={handleCopy}
              className={`mt-4 w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
              {copied ? "✅ คัดลอกข้อความแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>

            {/* Tips */}
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2">คำแนะนำ</p>
              {[
                "กรอกข้อมูลให้ครบในทุกช่องที่มี *",
                "ตรวจสอบยอดและ Tier ให้ถูกต้องก่อนส่ง",
                "แนบไฟล์หลักฐานให้ครบทั้ง 3 รายการ",
                'กด "คัดลอกข้อความอีเมล" เพื่อคัดลอกเนื้อหาพร้อมส่งอีเมล',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
