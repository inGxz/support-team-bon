"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type BillRow = { id: number; desc: string; amount: string };
let nid = 2;

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5 normal-case">*</span>}
      </label>
      {children}
    </div>
  );
}
const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white placeholder-gray-300";
const numInp = inp + " text-right";

function SH({ num, icon, title }: { num: string; icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">{num}</div>
      <h2 className="font-semibold text-gray-800 text-sm">{icon} {title}</h2>
    </div>
  );
}

export default function PersonalReimbursementPage() {
  const router = useRouter();

  // Request details
  const [purpose,     setPurpose]     = useState("");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [bizPurpose,  setBizPurpose]  = useState("");

  // Employee info
  const [empName,     setEmpName]     = useState("");
  const [department,  setDepartment]  = useState("");
  const [ibClient,    setIbClient]    = useState("");
  const [empEmail,    setEmpEmail]    = useState("");
  const [uid,         setUid]         = useState("");

  // Bills
  const [bills, setBills] = useState<BillRow[]>([{ id: 1, desc: "", amount: "" }]);

  // Bank
  const [accName,   setAccName]   = useState("");
  const [accNo,     setAccNo]     = useState("");
  const [bank,      setBank]      = useState("");
  const [branch,    setBranch]    = useState("");

  const [copied, setCopied] = useState(false);

  // ── Calculations ──────────────────────────────────────────────────────────
  const total = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  // ── Bill helpers ──────────────────────────────────────────────────────────
  const addBill    = () => setBills(p => [...p, { id: nid++, desc: "", amount: "" }]);
  const removeBill = (id: number) => setBills(p => p.filter(b => b.id !== id));
  const updateBill = (id: number, k: keyof BillRow, v: string) =>
    setBills(p => p.map(b => b.id === id ? { ...b, [k]: v } : b));

  // ── Email builder ─────────────────────────────────────────────────────────
  const buildEmail = useCallback(() => {
    const billLines = bills
      .filter(b => b.desc || b.amount)
      .map((b, i) => `  ${i + 1}. ${b.desc || "-"} — ${fmt(parseFloat(b.amount) || 0, 2)} THB`)
      .join("\n");

    return `Dear admin team,

I am writing this email to kindly request for your approval for my request.

I would like to request reimbursement for: ${purpose || "[Please specify]"}
Date: ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}
Business Purpose: ${bizPurpose || "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name             : ${empName || "-"}
Department       : ${department || "-"}
IB & Client Name : ${ibClient || "-"}
E-mail           : ${empEmail || "-"}
UID              : ${uid || "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BILL DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${billLines || "  (ยังไม่ได้กรอกรายการ)"}

Total: ${fmt(total, 2)} THB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE'S BANK DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please transfer to bank account below.
Account name : ${accName || "-"}
Account no.  : ${accNo || "-"}
Bank         : ${bank || "-"}
Branch       : ${branch || "-"}

Kindly approve the reimbursement at your earliest convenience. Thank you for your kind attention.

Best regards,
${empName || "[Your Name]"}`;
  }, [purpose, dateFrom, dateTo, bizPurpose, empName, department, ibClient, empEmail, uid, bills, total, accName, accNo, bank, branch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setPurpose(""); setDateFrom(""); setDateTo(""); setBizPurpose("");
    setEmpName(""); setDepartment(""); setIbClient(""); setEmpEmail(""); setUid("");
    setBills([{ id: 1, desc: "", amount: "" }]);
    setAccName(""); setAccNo(""); setBank(""); setBranch("");
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
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
              {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="px-6 flex gap-1 border-t border-gray-100">
          <button onClick={() => router.push("/reimbursement/ads")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            📢 เบิกค่า Ads
          </button>
          <button onClick={() => router.push("/reimbursement/merchandise")}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent hover:border-gray-300 transition">
            🎁 เบิกของรางวัล
          </button>
          <button className="px-5 py-2.5 text-sm font-semibold text-amber-600 border-b-2 border-amber-500 bg-white -mb-px">
            💰 เบิกเงินส่วนตัว
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Section 1: Request Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="1" icon="💰" title="Request Details" />
            <div className="space-y-4">
              <Field label="ต้องการเบิกเงินสำหรับ" required>
                <input className={inp} placeholder="เช่น ค่าเดินทาง, ค่าอาหาร, ค่าอุปกรณ์..." value={purpose} onChange={e => setPurpose(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date From" required>
                  <input type="date" className={inp} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </Field>
                <Field label="Date To" required>
                  <input type="date" className={inp} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </Field>
              </div>
              <Field label="Business Purpose" required>
                <textarea className={inp} placeholder="อธิบายวัตถุประสงค์ทางธุรกิจ..." rows={3} style={{ resize: "none" }}
                  value={bizPurpose} onChange={e => setBizPurpose(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 2: Employee Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="2" icon="👤" title="Employee Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input className={inp} placeholder="ชื่อ-นามสกุล" value={empName} onChange={e => setEmpName(e.target.value)} />
              </Field>
              <Field label="Department" required>
                <input className={inp} placeholder="แผนก" value={department} onChange={e => setDepartment(e.target.value)} />
              </Field>
              <Field label="IB & Client Name">
                <input className={inp} placeholder="ชื่อ IB / ลูกค้า" value={ibClient} onChange={e => setIbClient(e.target.value)} />
              </Field>
              <Field label="E-mail" required>
                <input type="email" className={inp} placeholder="email@example.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
              </Field>
              <Field label="UID">
                <input className={inp} placeholder="กรอก UID" value={uid} onChange={e => setUid(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 3: Bill Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="3" icon="🧾" title="Bill Details" />
            <div className="space-y-2 mb-3">
              <div className="grid grid-cols-12 gap-2 pb-1 border-b border-gray-100">
                <div className="col-span-1 text-xs text-gray-400 font-medium">#</div>
                <div className="col-span-7 text-xs text-gray-400 font-medium">รายการ / คำอธิบาย</div>
                <div className="col-span-3 text-xs text-gray-400 font-medium text-right">จำนวนเงิน (THB)</div>
                <div className="col-span-1"></div>
              </div>
              {bills.map((b, i) => (
                <div key={b.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1 text-xs text-gray-400 text-center">{i + 1}</div>
                  <div className="col-span-7">
                    <input className={inp + " text-xs"} placeholder="รายการ / คำอธิบาย" value={b.desc} onChange={e => updateBill(b.id, "desc", e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <input type="number" className={numInp + " text-xs"} placeholder="0.00" min="0" value={b.amount} onChange={e => updateBill(b.id, "amount", e.target.value)} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {bills.length > 1 && (
                      <button onClick={() => removeBill(b.id)} className="text-red-400 hover:text-red-600 text-base leading-none">×</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addBill} className="text-xs text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition font-medium">
              + เพิ่มรายการ
            </button>
            <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-sm font-bold text-amber-800">Total</span>
              <span className="text-xl font-black text-amber-700">{fmt(total, 2)} THB</span>
            </div>
          </div>

          {/* Section 4: Bank Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="4" icon="🏦" title="Employee's Bank Details" />
            <p className="text-xs text-gray-400 mb-4">Please transfer to bank account below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Name" required>
                <input className={inp} placeholder="ชื่อบัญชี" value={accName} onChange={e => setAccName(e.target.value)} />
              </Field>
              <Field label="Account No." required>
                <input className={inp} placeholder="เลขบัญชี" value={accNo} onChange={e => setAccNo(e.target.value)} />
              </Field>
              <Field label="Bank" required>
                <select className={inp} value={bank} onChange={e => setBank(e.target.value)}>
                  <option value="">เลือกธนาคาร</option>
                  {["กสิกรไทย (KBank)","ไทยพาณิชย์ (SCB)","กรุงเทพ (BBL)","กรุงไทย (KTB)","ทหารไทยธนชาต (TTB)","กรุงศรีอยุธยา (BAY)","ออมสิน","ธ.ก.ส."].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label="Branch" required>
                <input className={inp} placeholder="สาขา" value={branch} onChange={e => setBranch(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Section 5: Attachment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="5" icon="📎" title="Attachments (แนบใบเสร็จ / หลักฐาน)" />
            <div className="border border-dashed border-gray-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">🧾</div>
              <p className="text-sm font-semibold text-gray-700 mb-1">ใบเสร็จ / หลักฐานการชำระเงิน</p>
              <p className="text-xs text-gray-400">รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)</p>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">* แนบไฟล์ในอีเมลเมื่อส่งจริง</p>
          </div>
        </div>

        {/* ── RIGHT ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">

            {/* Summary */}
            <h3 className="font-semibold text-gray-700 text-sm mb-4">📋 สรุป</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>ผู้ขอเบิก</span><span className="font-medium">{empName || "–"}</span></div>
              <div className="flex justify-between text-gray-600"><span>แผนก</span><span className="font-medium">{department || "–"}</span></div>
              <div className="flex justify-between text-gray-600"><span>ช่วงวันที่</span><span className="font-medium text-right text-xs">{dateFrom && dateTo ? `${fmtDate(dateFrom)} – ${fmtDate(dateTo)}` : "–"}</span></div>
              <div className="flex justify-between text-gray-600"><span>จำนวนรายการ</span><span className="font-medium">{bills.filter(b => b.desc || b.amount).length} รายการ</span></div>
              <div className="flex justify-between font-bold text-amber-700 text-base border-t pt-2">
                <span>ยอดรวมทั้งหมด</span>
                <span>{fmt(total, 2)} THB</span>
              </div>
            </div>

            {/* Email Preview */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">📧 ตัวอย่างอีเมล (Preview)</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{buildEmail()}</pre>
              </div>
            </div>

            <button onClick={handleCopy}
              className={`mt-4 w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
              {copied ? "✅ คัดลอกข้อความแล้ว!" : "📋 คัดลอกข้อความอีเมล"}
            </button>

            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 mb-2">คำแนะนำ</p>
              {["กรอกข้อมูลให้ครบทุกช่องที่มี *","ระบุวัตถุประสงค์ทางธุรกิจให้ชัดเจน","แนบใบเสร็จทุกรายการในอีเมล",'กด "คัดลอก" แล้ววางในอีเมลได้เลย'].map((t, i) => (
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
