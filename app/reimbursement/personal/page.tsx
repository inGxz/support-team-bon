"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function sanitizeDecimal(v: string): string {
  let s = v.replace(/[^0-9.]/g, "");
  const i = s.indexOf(".");
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
  return s;
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

// Internal keys (English) — used as state keys & in email
const TRAVEL_KEYS = [
  "Airport ↔ Hotel Transportation",
  "Airfare",
  "Hotel Accommodation",
  "Transportation for Client / IB Meeting",
  "Business Client Entertainment",
  "Coffee Trade",
  "Food & Beverage Expenses",
];

const LABELS = {
  th: {
    toggleBtn: "EN",
    sec1: "ข้อมูลพนักงาน", sec2: "ค่าใช้จ่ายในการเดินทาง (Standard Business Travel Expenses)",
    sec3: "รายละเอียด IB / ลูกค้า", sec4: "บัญชีธนาคารพนักงาน", sec5: "แนบเอกสาร (ใบเสร็จ / หลักฐาน)",
    name: "ชื่อ-นามสกุล", dept: "แผนก", email: "อีเมล",
    travelDesc: "ติ๊กรายการที่ต้องการเบิก จากนั้นกรอกจำนวนเงิน",
    travelItems: [
      "ค่าเดินทางสนามบิน ↔ โรงแรม", "ค่าตั๋วเครื่องบิน", "ค่าที่พักโรงแรม",
      "ค่าเดินทางสำหรับการพบกับลูกค้า / IB", "ค่าเลี้ยงรับรองลูกค้าที่เกี่ยวข้องกับธุรกิจ",
      "Coffee trade", "Food & Beverage Expenses",
    ],
    meetingDateTime: "วันที่และเวลาประชุม", meetingPlace: "สถานที่ประชุม",
    ibName: "ชื่อ IB / ลูกค้า", ibUID: "IB UID (หากมี)",
    country: "ประเทศ / ภูมิภาค", budget: "งบประมาณโดยประมาณ",
    meetingPurpose: "วัตถุประสงค์ของการประชุม", expectedResult: "ผลลัพธ์ทางธุรกิจที่คาดว่าจะได้รับ",
    ibType: "ประเภทของ IB", ibTypeHint: "เลือกได้มากกว่า 1",
    referralSource: "แหล่งที่มาของการแนะนำ", networkSize: "จำนวนเครือข่ายลูกค้าที่คาดการณ์",
    newNetDeposit: "Net Deposit ต่อเดือนโดยประมาณ", newTradingVol: "Trading Volume ต่อเดือนโดยประมาณ",
    experience: "ประสบการณ์", bizPlan: "แผนการพัฒนาธุรกิจ", expectedROI: "ROI ที่คาดว่าจะได้รับ",
    netDeposit: "Net Deposit", tradingVolume: "Trading Volume",
    companyRevenue: "รายได้ที่สร้างให้บริษัท", growthTrend: "แนวโน้มการเติบโตของธุรกิจ",
    accName: "ชื่อบัญชี", accNo: "เลขบัญชี", bankLabel: "ธนาคาร", branchLabel: "สาขา",
    selectBank: "เลือกธนาคาร", transferNote: "กรุณาโอนเงินเข้าบัญชีด้านล่าง",
    attachNote: "รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)", attachSub: "* แนบไฟล์ในอีเมลเมื่อส่งจริง",
    receiptLabel: "ใบเสร็จ / หลักฐานการชำระเงิน",
    summary: "สรุป", requester: "ผู้ขอเบิก", deptSum: "แผนก", items: "รายการเดินทาง", totalLabel: "ยอดรวมทั้งหมด",
    preview: "ตัวอย่างอีเมล (Preview)", copyBtn: "คัดลอกข้อความอีเมล", copiedBtn: "คัดลอกแล้ว!",
    clearBtn: "ล้างข้อมูล", newIBInfo: "📋 ข้อมูล New IB", existingIBInfo: "📊 ข้อมูล Existing IB",
  },
  en: {
    toggleBtn: "TH",
    sec1: "Employee Information", sec2: "Standard Business Travel Expenses",
    sec3: "IB / Client Entertainment Detail", sec4: "Employee's Bank Details", sec5: "Attachments (Receipt / Evidence)",
    name: "Full Name", dept: "Department", email: "E-mail",
    travelDesc: "Select items to claim and enter the amount",
    travelItems: TRAVEL_KEYS,
    meetingDateTime: "Meeting Date & Time", meetingPlace: "Meeting Location",
    ibName: "IB / Client Name", ibUID: "IB UID (if applicable)",
    country: "Country / Region", budget: "Estimated Budget",
    meetingPurpose: "Meeting Purpose", expectedResult: "Expected Business Outcome",
    ibType: "IB Type", ibTypeHint: "Multiple selection allowed",
    referralSource: "Referral Source", networkSize: "Estimated Network Size",
    newNetDeposit: "Estimated Net Deposit / Month", newTradingVol: "Estimated Trading Volume / Month",
    experience: "Experience", bizPlan: "Business Development Plan", expectedROI: "Expected ROI",
    netDeposit: "Net Deposit", tradingVolume: "Trading Volume",
    companyRevenue: "Revenue Generated for Company", growthTrend: "Business Growth Trend",
    accName: "Account Name", accNo: "Account No.", bankLabel: "Bank", branchLabel: "Branch",
    selectBank: "Select Bank", transferNote: "Please transfer to the bank account below.",
    attachNote: "Supports JPG, PNG, PDF (max 10MB)", attachSub: "* Attach files when sending the actual email",
    receiptLabel: "Receipt / Payment Evidence",
    summary: "Summary", requester: "Requester", deptSum: "Department", items: "Travel Items", totalLabel: "Total Amount",
    preview: "Email Preview", copyBtn: "Copy Email", copiedBtn: "Copied!",
    clearBtn: "Clear", newIBInfo: "📋 New IB Information", existingIBInfo: "📊 Existing IB Information",
  },
};

export default function PersonalReimbursementPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"th" | "en">("th");
  const L = LABELS[lang];

  // Employee info
  const [empName,    setEmpName]    = useState("");
  const [department, setDepartment] = useState("");
  const [empEmail,   setEmpEmail]   = useState("");

  // Travel expenses (keyed by English label)
  const [travelChecked, setTravelChecked] = useState<Record<string, boolean>>({});
  const [travelAmounts, setTravelAmounts] = useState<Record<string, string>>({});

  // IB / Client Entertainment Detail
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [meetingPlace,    setMeetingPlace]    = useState("");
  const [ibName,          setIbName]          = useState("");
  const [ibUID,           setIbUID]           = useState("");
  const [country,         setCountry]         = useState("");
  const [meetingPurpose,  setMeetingPurpose]  = useState("");
  const [budget,          setBudget]          = useState("");
  const [expectedResult,  setExpectedResult]  = useState("");
  const [ibTypes,         setIbTypes]         = useState<string[]>([]);

  // New IB
  const [referralSource, setReferralSource] = useState("");
  const [networkSize,    setNetworkSize]    = useState("");
  const [newNetDeposit,  setNewNetDeposit]  = useState("");
  const [newTradingVol,  setNewTradingVol]  = useState("");
  const [experience,     setExperience]     = useState("");
  const [bizPlan,        setBizPlan]        = useState("");
  const [expectedROI,    setExpectedROI]    = useState("");

  // Existing IB
  const [netDeposit,     setNetDeposit]     = useState("");
  const [tradingVolume,  setTradingVolume]  = useState("");
  const [companyRevenue, setCompanyRevenue] = useState("");
  const [growthTrend,    setGrowthTrend]    = useState("");

  // Bank
  const [accName, setAccName] = useState("");
  const [accNo,   setAccNo]   = useState("");
  const [bank,    setBank]    = useState("");
  const [branch,  setBranch]  = useState("");

  const [copied, setCopied] = useState(false);

  const total = TRAVEL_KEYS.filter(k => travelChecked[k])
    .reduce((s, k) => s + (parseFloat(travelAmounts[k] || "0") || 0), 0);

  const toggleTravel = (key: string) => {
    setTravelChecked(p => ({ ...p, [key]: !p[key] }));
    if (travelChecked[key]) setTravelAmounts(p => ({ ...p, [key]: "" }));
  };
  const toggleIbType = (val: string) =>
    setIbTypes(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  // Email always in English
  const buildEmail = useCallback(() => {
    const checkedKeys = TRAVEL_KEYS.filter(k => travelChecked[k]);
    const travelLines = checkedKeys.length
      ? checkedKeys.map(k => `  • ${k}: ${fmt(parseFloat(travelAmounts[k] || "0") || 0, 2)} THB`).join("\n")
      : "  (No items selected)";

    const newIBSection = ibTypes.includes("New IB") ? `

  [New IB]
  Referral Source                    : ${referralSource || "-"}
  Estimated Network Size             : ${networkSize || "-"}
  Estimated Net Deposit / Month      : ${newNetDeposit || "-"}
  Estimated Trading Volume / Month   : ${newTradingVol || "-"}
  Experience                         : ${experience || "-"}
  Business Development Plan          : ${bizPlan || "-"}
  Expected ROI                       : ${expectedROI || "-"}` : "";

    const existingIBSection = ibTypes.includes("Existing IB") ? `

  [Existing IB]
  Net Deposit                        : ${netDeposit || "-"}
  Trading Volume                     : ${tradingVolume || "-"}
  Revenue Generated for Company      : ${companyRevenue || "-"}
  Business Growth Trend              : ${growthTrend || "-"}` : "";

    return `Dear Admin Team,

I am writing this email to kindly request your approval for my reimbursement request.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name         : ${empName || "-"}
Department   : ${department || "-"}
E-mail       : ${empEmail || "-"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STANDARD BUSINESS TRAVEL EXPENSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${travelLines}

Total: ${fmt(total, 2)} THB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IB / CLIENT ENTERTAINMENT DETAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Meeting Date & Time          : ${meetingDateTime || "-"}
Meeting Location             : ${meetingPlace || "-"}
IB / Client Name             : ${ibName || "-"}
IB UID                       : ${ibUID || "-"}
Country / Region             : ${country || "-"}
Meeting Purpose              : ${meetingPurpose || "-"}
Estimated Budget             : ${budget || "-"}
Expected Business Outcome    : ${expectedResult || "-"}
IB Type                      : ${ibTypes.join(", ") || "-"}
${newIBSection}${existingIBSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMPLOYEE'S BANK DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please transfer to the bank account below.
Account Name : ${accName || "-"}
Account No.  : ${accNo || "-"}
Bank         : ${bank || "-"}
Branch       : ${branch || "-"}

Kindly approve the reimbursement at your earliest convenience. Thank you for your kind attention.

Best regards,
${empName || "[Your Name]"}`;
  }, [empName, department, empEmail, travelChecked, travelAmounts, total, meetingDateTime, meetingPlace, ibName, ibUID, country, meetingPurpose, budget, expectedResult, ibTypes, referralSource, networkSize, newNetDeposit, newTradingVol, experience, bizPlan, expectedROI, netDeposit, tradingVolume, companyRevenue, growthTrend, accName, accNo, bank, branch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmail()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setEmpName(""); setDepartment(""); setEmpEmail("");
    setTravelChecked({}); setTravelAmounts({});
    setMeetingDateTime(""); setMeetingPlace(""); setIbName(""); setIbUID("");
    setCountry(""); setMeetingPurpose(""); setBudget(""); setExpectedResult("");
    setIbTypes([]);
    setReferralSource(""); setNetworkSize(""); setNewNetDeposit(""); setNewTradingVol("");
    setExperience(""); setBizPlan(""); setExpectedROI("");
    setNetDeposit(""); setTradingVolume(""); setCompanyRevenue(""); setGrowthTrend("");
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
        .lang-btn{border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;border:1.5px solid #d4af37;color:#d4af37;background:transparent;cursor:pointer;white-space:nowrap;transition:all 0.15s}
        .lang-btn:hover{background:#d4af37;color:#fff}
      `}</style>

      {/* Header */}
      <div className="rh-wrap">
        {/* Desktop */}
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
            <button className="lang-btn" onClick={() => setLang(l => l === "th" ? "en" : "th")}>{L.toggleBtn}</button>
            <button className="rh-btn-clear" onClick={handleReset}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.74"/></svg>
              {L.clearBtn}
            </button>
            <button className="rh-btn-copy" onClick={handleCopy} style={{background:copied?"#22c55e":"#f97316"}}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {copied ? L.copiedBtn : L.copyBtn}
            </button>
            <button className="rh-btn-back" onClick={() => router.push("/reimbursement")}>
              <svg width="12" height="12" fill="none" stroke="#9c9a93" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="rh-mob">
          <div style={{padding:"18px 18px 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#1a1825,#2e2847)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="16" height="16" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#1a1825"}}>IB Reimbursement</div>
                <div style={{fontSize:9,color:"#b4b2a9",marginTop:1}}>Support Teambon VT Market</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button className="lang-btn" onClick={() => setLang(l => l === "th" ? "en" : "th")}>{L.toggleBtn}</button>
              <button onClick={() => router.push("/reimbursement")} style={{width:32,height:32,borderRadius:9,background:"#f7f6f2",border:"0.5px solid #e5e2d8",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <svg width="12" height="12" fill="none" stroke="#9c9a93" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
            </div>
          </div>
          <div style={{margin:"0 18px 14px",background:"#f5f3ee",borderRadius:12,padding:3,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2}}>
            <button onClick={() => router.push("/reimbursement/ads")} style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:"#9c9a93",background:"transparent",border:"none",cursor:"pointer"}}>เบิกค่า Ads</button>
            <button onClick={() => router.push("/reimbursement/merchandise")} style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:600,color:"#9c9a93",background:"transparent",border:"none",cursor:"pointer"}}>เบิกของรางวัล</button>
            <div style={{borderRadius:9,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:700,color:"#1a1825",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>เบิกเงินส่วนตัว</div>
          </div>
          <div style={{padding:"0 18px 16px",display:"grid",gridTemplateColumns:"1fr 1.8fr",gap:8}}>
            <button onClick={handleReset} style={{borderRadius:12,padding:"11px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,fontWeight:600,color:"#888780",background:"#f5f3ee",border:"0.5px solid #e5e2d8",cursor:"pointer"}}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.74"/></svg>
              {L.clearBtn}
            </button>
            <button onClick={handleCopy} style={{borderRadius:12,padding:"11px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:11,fontWeight:700,color:"#fff",background:copied?"#22c55e":"#f97316",border:"none",cursor:"pointer"}}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {copied ? L.copiedBtn : L.copyBtn}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">

          {/* Section 1: Employee Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="1" icon="👤" title={L.sec1} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={L.name} required>
                <input className={inp} placeholder={L.name} value={empName} onChange={e => setEmpName(e.target.value)} />
              </Field>
              <Field label={L.dept} required>
                <input className={inp} placeholder={L.dept} value={department} onChange={e => setDepartment(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={L.email} required>
                  <input type="email" className={inp} placeholder="email@example.com" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
                </Field>
              </div>
            </div>
          </div>

          {/* Section 2: Travel Expenses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="2" icon="✈️" title={L.sec2} />
            <p className="text-xs text-gray-400 mb-3">{L.travelDesc}</p>
            <div className="space-y-2">
              {TRAVEL_KEYS.map((key, i) => {
                const checked = !!travelChecked[key];
                const displayLabel = L.travelItems[i];
                return (
                  <div key={key}>
                    <label onClick={() => toggleTravel(key)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition select-none
                        ${checked ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/40"}`}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition
                        ${checked ? "bg-amber-500 border-amber-500" : "border-gray-300 bg-white"}`}>
                        {checked && <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className={`text-sm font-medium flex-1 ${checked ? "text-amber-800" : "text-gray-600"}`}>{displayLabel}</span>
                    </label>
                    {checked && (
                      <div className="mt-1 ml-7">
                        <input type="text" inputMode="decimal" className={numInp + " text-sm"} placeholder="0.00 THB"
                          value={travelAmounts[key] || ""}
                          onChange={e => setTravelAmounts(p => ({ ...p, [key]: sanitizeDecimal(e.target.value) }))} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {Object.values(travelChecked).some(Boolean) && (
              <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-amber-800">Total</span>
                <span className="text-xl font-black text-amber-700">{fmt(total, 2)} THB</span>
              </div>
            )}
          </div>

          {/* Section 3: IB / Client */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="3" icon="🤝" title={L.sec3} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={L.meetingDateTime} required>
                <input type="datetime-local" className={inp} value={meetingDateTime} onChange={e => setMeetingDateTime(e.target.value)} />
              </Field>
              <Field label={L.meetingPlace} required>
                <input className={inp} placeholder={L.meetingPlace} value={meetingPlace} onChange={e => setMeetingPlace(e.target.value)} />
              </Field>
              <Field label={L.ibName} required>
                <input className={inp} placeholder={L.ibName} value={ibName} onChange={e => setIbName(e.target.value)} />
              </Field>
              <Field label={L.ibUID}>
                <input className={inp} placeholder="IB UID" value={ibUID} onChange={e => setIbUID(e.target.value)} />
              </Field>
              <Field label={L.country} required>
                <input className={inp} placeholder="e.g. Thailand, SEA" value={country} onChange={e => setCountry(e.target.value)} />
              </Field>
              <Field label={L.budget}>
                <input className={inp} placeholder="THB / USD" value={budget} onChange={e => setBudget(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={L.meetingPurpose} required>
                  <textarea className={inp} rows={2} style={{resize:"none"}} value={meetingPurpose} onChange={e => setMeetingPurpose(e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={L.expectedResult}>
                  <textarea className={inp} rows={2} style={{resize:"none"}} value={expectedResult} onChange={e => setExpectedResult(e.target.value)} />
                </Field>
              </div>
            </div>

            {/* IB Type */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {L.ibType} <span className="text-gray-400 normal-case font-normal">({L.ibTypeHint})</span>
              </label>
              <div className="flex gap-3">
                {["New IB", "Existing IB"].map(type => {
                  const checked = ibTypes.includes(type);
                  return (
                    <label key={type} onClick={() => toggleIbType(type)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition select-none flex-1 justify-center
                        ${checked ? "border-purple-400 bg-purple-50 text-purple-800" : "border-gray-200 bg-white text-gray-600 hover:border-purple-200"}`}>
                      <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition
                        ${checked ? "bg-purple-500 border-purple-500" : "border-gray-300 bg-white"}`}>
                        {checked && <svg width="9" height="9" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className="text-sm font-semibold">{type}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* New IB */}
            {ibTypes.includes("New IB") && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-700 mb-3 uppercase tracking-wide">{L.newIBInfo}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={L.referralSource}>
                    <input className={inp} value={referralSource} onChange={e => setReferralSource(e.target.value)} />
                  </Field>
                  <Field label={L.networkSize}>
                    <input className={inp} value={networkSize} onChange={e => setNetworkSize(e.target.value)} />
                  </Field>
                  <Field label={L.newNetDeposit}>
                    <input className={inp} placeholder="USD / THB" value={newNetDeposit} onChange={e => setNewNetDeposit(e.target.value)} />
                  </Field>
                  <Field label={L.newTradingVol}>
                    <input className={inp} placeholder="Lots / USD" value={newTradingVol} onChange={e => setNewTradingVol(e.target.value)} />
                  </Field>
                  <Field label={L.experience}>
                    <input className={inp} value={experience} onChange={e => setExperience(e.target.value)} />
                  </Field>
                  <Field label={L.expectedROI}>
                    <input className={inp} value={expectedROI} onChange={e => setExpectedROI(e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={L.bizPlan}>
                      <textarea className={inp} rows={2} style={{resize:"none"}} value={bizPlan} onChange={e => setBizPlan(e.target.value)} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* Existing IB */}
            {ibTypes.includes("Existing IB") && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-3 uppercase tracking-wide">{L.existingIBInfo}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={L.netDeposit}>
                    <input className={inp} placeholder="USD / THB" value={netDeposit} onChange={e => setNetDeposit(e.target.value)} />
                  </Field>
                  <Field label={L.tradingVolume}>
                    <input className={inp} placeholder="Lots / USD" value={tradingVolume} onChange={e => setTradingVolume(e.target.value)} />
                  </Field>
                  <Field label={L.companyRevenue}>
                    <input className={inp} placeholder="USD / THB" value={companyRevenue} onChange={e => setCompanyRevenue(e.target.value)} />
                  </Field>
                  <Field label={L.growthTrend}>
                    <input className={inp} value={growthTrend} onChange={e => setGrowthTrend(e.target.value)} />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Bank Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SH num="4" icon="🏦" title={L.sec4} />
            <p className="text-xs text-gray-400 mb-4">{L.transferNote}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={L.accName} required>
                <input className={inp} value={accName} onChange={e => setAccName(e.target.value)} />
              </Field>
              <Field label={L.accNo} required>
                <input className={inp} value={accNo} onChange={e => setAccNo(e.target.value)} />
              </Field>
              <Field label={L.bankLabel} required>
                <select className={inp} value={bank} onChange={e => setBank(e.target.value)}>
                  <option value="">{L.selectBank}</option>
                  {["กสิกรไทย (KBank)","ไทยพาณิชย์ (SCB)","กรุงเทพ (BBL)","กรุงไทย (KTB)","ทหารไทยธนชาต (TTB)","กรุงศรีอยุธยา (BAY)","ออมสิน","ธ.ก.ส."].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label={L.branchLabel} required>
                <input className={inp} value={branch} onChange={e => setBranch(e.target.value)} />
              </Field>
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-semibold text-gray-700 text-sm mb-4">📋 {L.summary}</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>{L.requester}</span><span className="font-medium">{empName || "–"}</span></div>
              <div className="flex justify-between text-gray-600"><span>{L.deptSum}</span><span className="font-medium">{department || "–"}</span></div>
              <div className="flex justify-between text-gray-600"><span>{L.items}</span><span className="font-medium">{TRAVEL_KEYS.filter(k => travelChecked[k]).length} {lang === "th" ? "รายการ" : "items"}</span></div>
              <div className="flex justify-between font-bold text-amber-700 text-base border-t pt-2">
                <span>{L.totalLabel}</span>
                <span>{fmt(total, 2)} THB</span>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">📧 {L.preview}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{buildEmail()}</pre>
              </div>
            </div>
            <button onClick={handleCopy}
              className={`mt-4 w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${copied ? "bg-green-500 text-white" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
              {copied ? `✅ ${L.copiedBtn}` : `📋 ${L.copyBtn}`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
