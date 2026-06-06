"use client";

import { useRouter } from "next/navigation";

export default function ReimbursementPage() {
  const router = useRouter();

  const cards = [
    {
      id: "ads",
      route: "/reimbursement/ads",
      color: "#3b64dc",
      barGrad: "linear-gradient(90deg,#3b64dc,#60a5fa)",
      bgLight: "#eff6ff",
      border: "#bfdbfe",
      hoverBorder: "#bfdbfe",
      pillLabel: "Ads Fee Support",
      title: "เบิกค่าโฆษณา",
      desc: "ขอเบิกค่า Ads สำหรับ IB ที่เข้าเกณฑ์ Tier พร้อมคำนวณยอดอัตโนมัติ",
      features: ["คำนวณ Net Deposit อัตโนมัติ", "ตรวจ Tier 1–3 อัตโนมัติ", "รองรับ Facebook · Line · Google"],
      icon: (
        <svg width="20" height="20" fill="none" stroke="#3b64dc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      id: "merchandise",
      route: "/reimbursement/merchandise",
      color: "#7c3aed",
      barGrad: "linear-gradient(90deg,#7c3aed,#c084fc)",
      bgLight: "#f5f3ff",
      border: "#ddd6fe",
      hoverBorder: "#ddd6fe",
      pillLabel: "Merchandise Support",
      title: "เบิกของรางวัล",
      desc: "ขอเบิกของแจก Merchandise ตาม Tier พร้อมตรวจสอบจำนวนและมูลค่า",
      features: ["Tier A–3 + Special อัตโนมัติ", "เลือกของได้ 8 ประเภท", "ตรวจ Pass / Over Limit ทันที"],
      icon: (
        <svg width="20" height="20" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
    },
    {
      id: "personal",
      route: "/reimbursement/personal",
      color: "#d97706",
      barGrad: "linear-gradient(90deg,#d97706,#fbbf24)",
      bgLight: "#fffbeb",
      border: "#fde68a",
      hoverBorder: "#fcd34d",
      pillLabel: "Personal Reimbursement",
      title: "เบิกเงินส่วนตัว",
      desc: "ขอเบิกค่าใช้จ่ายส่วนตัวเพื่อธุรกิจ พร้อมระบุรายการบิลและข้อมูลบัญชีธนาคาร",
      features: ["ใส่รายการบิลได้หลายรายการ", "ระบุบัญชีธนาคารโอนเงิน", "สร้างอีเมลอัตโนมัติ"],
      icon: (
        <svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          <line x1="6" y1="15" x2="10" y2="15"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rl-root {
          min-height: 100vh;
          background: #f5f4f0;
          font-family: 'Inter', 'Noto Sans Thai', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .rl-nav {
          width: 100%; max-width: 960px;
          padding: 28px 36px 0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .rl-logo { display: flex; align-items: center; gap: 10px; }
        .rl-logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: #1e1b2e;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .rl-logo-title { font-size: 13px; font-weight: 700; color: #1e1b2e; }
        .rl-logo-sub { font-size: 10px; color: #b0aea6; margin-top: 1px; }
        .rl-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #a0a098;
          background: #fff; border: 0.5px solid #e2e0d8;
          border-radius: 20px; padding: 5px 13px;
        }

        .rl-hero {
          text-align: center;
          padding: 52px 36px 36px;
          width: 100%; max-width: 960px;
        }
        .rl-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 700; color: #6366f1;
          background: #eef2ff; border: 0.5px solid #c7d2fe;
          border-radius: 20px; padding: 4px 13px;
          margin-bottom: 16px; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .rl-h1 {
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 900; color: #1e1b2e;
          letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 12px;
        }
        .rl-h1 span {
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rl-desc { font-size: 13px; color: #a0a098; line-height: 1.75; max-width: 460px; margin: 0 auto; }

        /* ── Cards ── */
        .rl-cards {
          width: 100%; max-width: 960px;
          padding: 0 36px 64px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: stretch;
        }

        .rl-card {
          background: #fff;
          border: 0.5px solid #e8e6de;
          border-radius: 20px;
          padding: 24px;
          cursor: pointer; text-align: left;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .rl-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }

        .rl-card-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px; border-radius: 20px 20px 0 0;
        }

        /* Desktop: icon standalone above type pill */
        .rl-icon-wrap {
          width: 46px; height: 46px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; flex-shrink: 0;
        }

        .rl-type {
          display: inline-flex;
          font-size: 9px; font-weight: 700;
          padding: 3px 9px; border-radius: 20px;
          letter-spacing: 0.04em; text-transform: uppercase;
          width: fit-content; margin-bottom: 8px;
        }

        .rl-card-title {
          font-size: 18px; font-weight: 800; color: #1e1b2e;
          margin-bottom: 8px; letter-spacing: -0.01em;
        }
        .rl-card-desc {
          font-size: 12px; color: #a0a098; line-height: 1.7;
          flex: 1; margin-bottom: 14px;
        }
        .rl-features { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
        .rl-feat { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #b0aea6; }
        .rl-feat-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        .rl-cta {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: 12px; padding: 11px 14px;
          font-size: 12.5px; font-weight: 700; margin-top: auto;
          border: none; cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .rl-cta:hover { opacity: 0.75; transform: scale(0.99); }

        .rl-footer {
          font-size: 11px; color: #c8c6bc;
          text-align: center; padding-bottom: 44px;
          display: flex; align-items: center; gap: 8px;
        }
        .rl-footer-dot { width: 3px; height: 3px; border-radius: 50%; background: #c8c6bc; }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .rl-nav { padding: 20px 18px 0; }
          .rl-badge { display: none; }
          .rl-hero { padding: 36px 18px 22px; }
          .rl-cards { grid-template-columns: 1fr; padding: 0 18px 48px; gap: 10px; }

          .rl-card { padding: 14px; border-radius: 14px; }
          .rl-card-bar { border-radius: 14px 14px 0 0; }

          .rl-mob-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .rl-icon-wrap { width: 36px; height: 36px; border-radius: 9px; margin-bottom: 0; }
          .rl-desk-icon { display: none; }
          .rl-desk-only { display: none; }
          .rl-features { display: none; }
          .rl-card-desc { font-size: 11.5px; margin-bottom: 10px; }
          .rl-card-title { font-size: 14px; margin-bottom: 1px; }
          .rl-type { font-size: 8px; margin-bottom: 2px; }
          .rl-cta { padding: 9px 14px; font-size: 12px; border-radius: 9px; }
        }
        @media (min-width: 641px) {
          .rl-mob-header { display: none; }
          .rl-desk-icon { display: flex; }
          .rl-desk-only { display: block; }
        }
      `}</style>

      <div className="rl-root">

        {/* Nav */}
        <nav className="rl-nav">
          <div className="rl-logo">
            <div className="rl-logo-icon">
              <svg width="17" height="17" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <div className="rl-logo-title">IB Reimbursement</div>
              <div className="rl-logo-sub">Support Teambon VT Market</div>
            </div>
          </div>
          <div className="rl-badge">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ไม่ต้อง Login
          </div>
        </nav>

        {/* Hero */}
        <section className="rl-hero">
          <div className="rl-pill">
            <svg width="7" height="7" fill="#6366f1" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
            ระบบขอเบิกค่าใช้จ่าย
          </div>
          <h1 className="rl-h1">เลือกประเภท<span>การขอเบิก</span></h1>
          <p className="rl-desc">กรอกข้อมูลให้ครบ ระบบจะสร้างอีเมลสำเร็จรูปให้ทันที<br/>พร้อมก็อปปี้ส่งได้เลย — ไม่บันทึกข้อมูลใดๆ</p>
        </section>

        {/* Cards */}
        <div className="rl-cards">
          {cards.map(c => (
            <button
              key={c.id}
              className="rl-card"
              onClick={() => router.push(c.route)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.hoverBorder)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e6de")}
            >
              <div className="rl-card-bar" style={{ background: c.barGrad }} />

              {/* Desktop: icon standalone */}
              <div className="rl-icon-wrap rl-desk-icon" style={{ background: c.bgLight, border: `0.5px solid ${c.border}` }}>
                {c.icon}
              </div>

              {/* Mobile: icon + text in a row */}
              <div className="rl-mob-header">
                <div className="rl-icon-wrap" style={{ background: c.bgLight, border: `0.5px solid ${c.border}` }}>
                  {c.icon}
                </div>
                <div>
                  <div className="rl-type" style={{ background: c.bgLight, color: c.color, border: `0.5px solid ${c.border}` }}>
                    {c.pillLabel}
                  </div>
                  <div className="rl-card-title">{c.title}</div>
                </div>
              </div>

              {/* Desktop: type + title */}
              <div className="rl-type rl-desk-only" style={{ background: c.bgLight, color: c.color, border: `0.5px solid ${c.border}` }}>
                {c.pillLabel}
              </div>
              <div className="rl-card-title rl-desk-only">{c.title}</div>

              <div className="rl-card-desc">{c.desc}</div>

              <div className="rl-features">
                {c.features.map(f => (
                  <div className="rl-feat" key={f}>
                    <div className="rl-feat-dot" style={{ background: c.color }} />
                    {f}
                  </div>
                ))}
              </div>

              <div className="rl-cta" style={{ background: c.bgLight, color: c.color }}>
                เริ่มกรอกข้อมูล
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="rl-footer">
          <span>กรอกข้อมูลแล้วก็อปปี้อีเมลไปส่งได้ทันที</span>
          <div className="rl-footer-dot" />
          <span>ไม่บันทึกข้อมูลใดๆ ทั้งสิ้น</span>
        </div>

      </div>
    </>
  );
}
