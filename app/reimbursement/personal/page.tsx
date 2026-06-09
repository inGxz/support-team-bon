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
  const [purposes,    setPurposes]    = useState<string[]>([]);
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

I would like to request reimbursement for: ${purposes.length ? purposes.join(" & ") : "[Please specify]"}
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
  }, [purposes, dateFrom, dateTo, bizPurpose, empName, department, ibClient, empEmail, uid, bills, total, accName, accNo, bank, branch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const togglePurpose = (val: string) =>
    setPurposes(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  const handleReset = () => {
    setPurposes([]); setDateFrom(""); setDateTo(""); setBizPurpose("");
    setEmpName(""); setDepartment(""); setIbClient(""); setEmpEmail(""); setUid("");
    setBills([{ id: 1, desc: "", amount: "" }]);
    setAccName(""); setAccNo(""); setBank(""); setBranch("");
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <style>{`
        .rh-wrap{background:#fff;border-bottom:0.5px solid #ede9e0;position:sticky;top:0;z-index:10;font-family:'Inter','Noto Sans Thai',sans-serif}
        .rh-mob{display:block}.rh-desk{display:none}
        @media(min-width:768px){.rh-mob{display:none}.rh-desk{display:flex;align-items:center;padding:12px 24px;gap:16px}}
        .rh-seg{background:#f5f3ee;border-radius:11px;padding:3px;display:inline-flex;gap:2px;flex:1;justify-content:center}
        .rh-seg-item{border-radius:8px;padding:7px 20px;font-size:11px;font-weight:600;color:#9c9a93;cursor:pointer;white-space:nowrap;letter-spacing:0.01em;background:transparent;border:none}
        .rh-seg-on{background:#fff;color:#1a1825;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
        .rh-btn-clear{background:#f5f3ee;border:0.5px solid #e5e2d8;border-radius:10px;padding:8px 14px;font-size:11px;font-weight:600;color:#888780;display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap}
        .rh-btn-copy{border:none;border-radius:10px;padding:8px 16px;font-size:11px;font-weight:700;color:#fff;display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
        .rh-btn-back{width:32px;height:32px;border-radius:9px;background:#f7f6f2;border:0.5px solid #e5e2d8;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
      `}</style>

      {/* Header */}
      <div className="rh-wrap">

        {/* ── Desktop ── */}
        <div className="rh-desk">
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#1a1825,#2e2847)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="16" height="16" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1825",letterSpacing:"-0.01em",lineHeight:1.3}}>IB Reimbursement</div>
              <div style={{fontSize:9,color:"#b4b2a9",marginTop:1}}>Support Teambon VT Market</div>
            </div>
          </div>
          <div className="rh-seg">
            <button className="rh-seg-item" onClick={() => router.push("/reimbursement/ads")}>เบิกค่า Ads</button>
            <button className="rh-seg-item" onClick={() => router.push("/reimbursement/merchandise")}>เบิกของรางวัล</button>
            <div className="rh-seg-item rh-seg-on">เบิกเงินส่วนตัว</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <button className="rh-btn-clear" onClick={handleReset}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.74"/></svg>
              ล้างข้อมูล
            </button>
            <button className="rh-btn-copy" onClick={handleCopy} style={{background:copied?"#22c55e":"#f97316"}}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความอีเมล"}
            </button>
            <button className="rh-btn-back" onClick={() => router.push("/reimbursement")}>
              <svg width="12" height="12" fill="none" stroke="#9c9a93" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ── Mobile (ไม่เปลี่ยน) ── */}
        <div className="rh-mob">
          <div style={{padding:"18px 18px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#1a1825,#2e2847)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1825",letterSpacing:"-0.01em",lineHeight:1.3}}>IB Reimbursement</div>
                <div style={{fontSize:9,color:"#b4b2a9",marginTop:1}}>Support Teambon VT Market</div>
              </div>
            </div>
            <button onClick={() => router.push("/reimbursement")} style={{width:32,height:32,borderRadius:9,background:"#f7f6f2",border:"0.5px solid #e5e2d8",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="12" height="12" fill="none" stroke="#9c9a93" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
          <div style={{margin:"0 18px 14px",background:"#f5f3ee",borderRadius:12,padding:3,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
            <button onClick={() => router.push("/reimbursement/ads")} style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:"#9c9a93",background:"transparent",border:"none",cursor:"pointer",letterSpacing:"0.01em"}}>เบิกค่า Ads</button>
            <button onClick={() => router.push("/reimbursement/merchandise")} style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:"#9c9a93",background:"transparent",border:"none",cursor:"pointer",letterSpacing:"0.01em"}}>เบิกของรางวัล</button>
            <div style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:700,color:"#1a1825",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",letterSpacing:"0.01em"}}>เบิกเงินส่วนตัว</div>
          </div>
          <div style={{padding:"0 18px 16px",display:"grid",gridTemplateColumns:"1fr 1.8fr",gap:8}}>
            <button onClick={handleReset} style={{borderRadius:12,padding:"11px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,fontWeight:600,color:"#888780",background:"#f5f3ee",border:"0.5px solid #e5e2d8",cursor:"pointer"}}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.74"/></svg>
              ล้างข้อมูล
            </button>
            <button onClick={handleCopy} style={{borderRadius:12,padding:"11px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,fontWeight:700,color:"#fff",background:copied?"#22c55e":"#f97316",border:"none",cursor:"pointer"}}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความอีเมล"}
            </button>
          </div>
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
                <div className="flex flex-col gap-2 mt-1">
                  {[
                    { val: "Transportation Expenses", icon: "🚗" },
                    { val: "Food & Beverage Expenses", icon: "🍽️" },
                    { val: "Hotel Expenses", icon: "🏨" },
                  ].map(({ val, icon }) => {
                    const checked = purposes.includes(val);
                    return (
                      <label key={val}
                        onClick={() => togglePurpose(val)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition select-none
                          ${checked
                            ? "border-amber-400 bg-amber-50 text-amber-800"
                            : "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/40"}`}>
                        <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition
                          ${checked ? "bg-amber-500 border-amber-500" : "border-gray-300 bg-white"}`}>
                          {checked && <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span className="text-sm font-medium">{icon} {val}</span>
                      </label>
                    );
                  })}
                </div>
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
