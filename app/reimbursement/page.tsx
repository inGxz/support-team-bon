"use client";

import { useRouter } from "next/navigation";

export default function ReimbursementPage() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "100vh", background: "#f8f7f4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'Inter', 'Noto Sans Thai', sans-serif" }}>

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 640, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#1e1b2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b2e" }}>IB Reimbursement</div>
            <div style={{ fontSize: 11, color: "#888780", marginTop: 1 }}>Support Teambon VT Market</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#888780", background: "#fff", border: "0.5px solid #ebe9e1", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ไม่ต้อง Login
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40, width: "100%", maxWidth: 640 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ebe9e1", border: "0.5px solid #d4d2ca", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#5f5e5a", marginBottom: 16 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ระบบขอเบิกค่าใช้จ่าย
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b2e", lineHeight: 1.2, marginBottom: 10 }}>เลือกประเภทการขอเบิก</h1>
        <p style={{ fontSize: 13, color: "#888780", lineHeight: 1.7 }}>กรอกข้อมูลให้ครบ ระบบจะสร้างอีเมลสำเร็จรูปให้ทันที พร้อมก็อปปี้ส่งได้เลย</p>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, width: "100%", maxWidth: 640, gridAutoRows: "1fr" }}>

        {/* Ads card */}
        <button onClick={() => router.push("/reimbursement/ads")}
          style={{ background: "#fff", border: "0.5px solid #ebe9e1", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#85B7EB"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ebe9e1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#378ADD", borderRadius: "20px 20px 0 0" }} />
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="22" height="22" fill="none" stroke="#185FA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#E6F1FB", color: "#185FA5", marginBottom: 10 }}>
            Ads Fee Support
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1b2e", marginBottom: 6 }}>เบิกค่าโฆษณา</div>
          <div style={{ fontSize: 12, color: "#888780", lineHeight: 1.6, marginBottom: 16 }}>ขอเบิกค่า Ads สำหรับ IB ที่เข้าเกณฑ์ Tier พร้อมคำนวณยอดอัตโนมัติ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
            {["คำนวณ Net Deposit อัตโนมัติ", "ตรวจ Tier 1–3 อัตโนมัติ", "รองรับ Facebook, Line, Google"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#5f5e5a" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#B5D4F4", flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#E6F1FB", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#185FA5" }}>
            เริ่มกรอกข้อมูล
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </button>

        {/* Merchandise card */}
        <button onClick={() => router.push("/reimbursement/merchandise")}
          style={{ background: "#fff", border: "0.5px solid #ebe9e1", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#AFA9EC"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ebe9e1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#7F77DD", borderRadius: "20px 20px 0 0" }} />
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="22" height="22" fill="none" stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#EEEDFE", color: "#534AB7", marginBottom: 10 }}>
            Merchandise Support
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1b2e", marginBottom: 6 }}>เบิกของรางวัล</div>
          <div style={{ fontSize: 12, color: "#888780", lineHeight: 1.6, marginBottom: 16 }}>ขอเบิกของแจก Merchandise ตาม Tier พร้อมตรวจสอบจำนวนและมูลค่า</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 16 }}>
            {["Tier A–3 + Special อัตโนมัติ", "เลือกของได้ 8 ประเภท", "ตรวจ Pass / Over Limit ทันที"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "#5f5e5a" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#CECBF6", flexShrink: 0 }} />
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EEEDFE", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#534AB7" }}>
            เริ่มกรอกข้อมูล
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </button>

        {/* Personal card */}
        <button onClick={() => router.push("/reimbursement/personal")}
          style={{ background: "#fff", border: "0.5px solid #ebe9e1", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", transition: "all 0.2s", gridColumn: "1 / -1" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#FDE68A"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#ebe9e1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#D97706", borderRadius: "20px 20px 0 0" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FFFBEB", color: "#B45309", marginBottom: 6 }}>
                Personal Reimbursement
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e1b2e", marginBottom: 4 }}>เบิกเงินส่วนตัว</div>
              <div style={{ fontSize: 12, color: "#888780", lineHeight: 1.6 }}>ขอเบิกค่าใช้จ่ายส่วนตัวที่ใช้เพื่อธุรกิจ พร้อมระบุรายการและข้อมูลบัญชีธนาคาร</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFBEB", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#B45309", flexShrink: 0, alignSelf: "center" }}>
              เริ่มกรอกข้อมูล
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 32, fontSize: 11, color: "#b4b2a9", textAlign: "center" }}>
        กรอกข้อมูลแล้วก็อปปี้อีเมลไปส่งได้ทันที · ไม่บันทึกข้อมูลใดๆ
      </p>
    </main>
  );
}
