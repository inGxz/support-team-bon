"use client";

import { useRouter } from "next/navigation";

export default function ReimbursementPage() {
  const router = useRouter();

  const cards = [
    {
      id: "ads",
      route: "/reimbursement/ads",
      color: "#2563eb",
      iconBg: "#0f2a5c",
      iconColor: "#93c5fd",
      dotColor: "#3b82f6",
      arrowBg: "#eff6ff",
      arrowBorder: "#bfdbfe",
      arrowColor: "#2563eb",
      deskBg: "#eff6ff",
      deskBorder: "#bfdbfe",
      deskType: "Ads Fee Support",
      title: "เบิกค่าโฆษณา",
      sub: "Tier 1–3 · Facebook · Line · Google",
      desc: "ขอเบิกค่า Ads สำหรับ IB ที่เข้าเกณฑ์ Tier พร้อมคำนวณยอดอัตโนมัติ",
      features: ["คำนวณ Net Deposit อัตโนมัติ", "ตรวจ Tier 1–3 อัตโนมัติ", "รองรับ Facebook · Line · Google"],
      iconPath: (
        <svg width="26" height="26" fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      iconPathDesk: (
        <svg width="20" height="20" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      id: "merchandise",
      route: "/reimbursement/merchandise",
      color: "#7c3aed",
      iconBg: "#1e0a4a",
      iconColor: "#c4b5fd",
      dotColor: "#7c3aed",
      arrowBg: "#f5f3ff",
      arrowBorder: "#ddd6fe",
      arrowColor: "#7c3aed",
      deskBg: "#f5f3ff",
      deskBorder: "#ddd6fe",
      deskType: "Merchandise Support",
      title: "เบิกของรางวัล",
      sub: "Tier A–Special · 8 ประเภทของรางวัล",
      desc: "ขอเบิกของแจก Merchandise ตาม Tier พร้อมตรวจสอบจำนวนและมูลค่า",
      features: ["Tier A–3 + Special อัตโนมัติ", "เลือกของได้ 8 ประเภท", "ตรวจ Pass / Over Limit ทันที"],
      iconPath: (
        <svg width="26" height="26" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
          <line x1="12" y1="22" x2="12" y2="7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
      iconPathDesk: (
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
      iconBg: "#431407",
      iconColor: "#fde68a",
      dotColor: "#d97706",
      arrowBg: "#fffbeb",
      arrowBorder: "#fde68a",
      arrowColor: "#d97706",
      deskBg: "#fffbeb",
      deskBorder: "#fde68a",
      deskType: "Personal Reimbursement",
      title: "เบิกเงินส่วนตัว",
      sub: "Transportation · Food & Beverage",
      desc: "ขอเบิกค่าใช้จ่ายส่วนตัวเพื่อธุรกิจ พร้อมระบุรายการบิลและบัญชีธนาคาร",
      features: ["ใส่รายการบิลได้หลายรายการ", "ระบุบัญชีธนาคารโอนเงิน", "สร้างอีเมลอัตโนมัติ"],
      iconPath: (
        <svg width="26" height="26" fill="none" stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
          <line x1="6" y1="15" x2="10" y2="15"/>
        </svg>
      ),
      iconPathDesk: (
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
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .rl-root{
          min-height:100vh;
          font-family:'Inter','Noto Sans Thai',sans-serif;
        }

        /* ══════════════════════════════
           MOBILE  (default)
        ══════════════════════════════ */
        .rl-root{ background:#1a1825; }

        /* ── mobile header ── */
        .rl-mob-header{
          background:#1a1825;
          padding:36px 22px 40px;
          position:relative;
          overflow:hidden;
        }
        .rl-mob-circle1{
          position:absolute;top:-40px;right:-40px;
          width:160px;height:160px;border-radius:50%;
          background:rgba(127,119,221,0.07);
          pointer-events:none;
        }
        .rl-mob-circle2{
          position:absolute;bottom:-30px;left:-30px;
          width:110px;height:110px;border-radius:50%;
          background:rgba(59,100,220,0.06);
          pointer-events:none;
        }
        .rl-mob-logo{
          display:flex;align-items:center;gap:9px;
          margin-bottom:28px;
        }
        .rl-mob-logo-icon{
          width:30px;height:30px;border-radius:9px;
          background:rgba(167,139,250,0.15);
          border:0.5px solid rgba(167,139,250,0.25);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .rl-mob-logo-t{font-size:12px;font-weight:700;color:#f0efff;line-height:1.2}
        .rl-mob-logo-s{font-size:9px;color:rgba(255,255,255,0.28);margin-top:1px}
        .rl-mob-tag{
          font-size:9px;font-weight:700;
          color:rgba(167,139,250,0.65);
          letter-spacing:0.12em;text-transform:uppercase;
          margin-bottom:10px;
        }
        .rl-mob-h1-white{
          font-size:32px;font-weight:900;color:#fff;
          line-height:1.15;letter-spacing:-0.03em;
          margin-bottom:4px;
          display:block;
        }
        .rl-mob-h1-grad{
          font-size:34px;font-weight:900;line-height:1.15;
          letter-spacing:-0.03em;
          background:linear-gradient(90deg,#f97316,#f59e0b,#eab308);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
          display:block;
          margin-bottom:16px;
        }
        .rl-mob-divider{display:flex;align-items:center;gap:7px}
        .rl-mob-line{width:20px;height:1px;background:rgba(255,255,255,0.12);flex-shrink:0}
        .rl-mob-subdesc{font-size:10px;color:rgba(255,255,255,0.27);line-height:1.65}

        /* ── mobile cards section ── */
        .rl-mob-cards{
          background:#f5f4f0;
          border-radius:32px 32px 0 0;
          padding:24px 18px 48px;
          display:flex;flex-direction:column;gap:14px;
          min-height:calc(100vh - 300px);
        }
        .rl-mob-card{
          background:#fff;
          border-radius:22px;
          border:0.5px solid #eae8e0;
          padding:22px 20px;
          display:flex;align-items:center;gap:16px;
          cursor:pointer;transition:transform 0.15s ease,box-shadow 0.15s ease;
          text-align:left;
          box-shadow:0 2px 12px rgba(0,0,0,0.05);
        }
        .rl-mob-card:active{transform:scale(0.98)}
        .rl-mob-icon{
          width:62px;height:62px;border-radius:18px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;position:relative;
        }
        .rl-mob-dot{
          position:absolute;top:-3px;right:-3px;
          width:12px;height:12px;border-radius:50%;
          border:2.5px solid #fff;
        }
        .rl-mob-body{flex:1;min-width:0}
        .rl-mob-title{font-size:17px;font-weight:800;color:#1a1825;letter-spacing:-0.01em;margin-bottom:4px}
        .rl-mob-sub{font-size:12px;color:#9c9a93;line-height:1.5}
        .rl-mob-arrow{
          width:42px;height:42px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
        }
        .rl-mob-footer{
          display:flex;align-items:center;justify-content:center;gap:6px;
          padding-top:10px;
        }
        .rl-mob-footer-t{font-size:11px;color:#b4b2a9}

        /* ══════════════════════════════
           DESKTOP  (≥ 768px)
        ══════════════════════════════ */
        @media(min-width:768px){
          .rl-root{background:#1a1825}
          .rl-mob-header{display:none}
          .rl-mob-cards{
            background:transparent;border-radius:0;
            padding:0;min-height:unset;gap:0;
            display:block;
          }
          .rl-mob-card{display:none}
          .rl-mob-footer{display:none}

          /* desktop nav */
          .rl-desk-nav{
            display:flex;align-items:center;justify-content:space-between;
            width:100%;max-width:960px;
            padding:28px 36px 0;
            margin:0 auto;
          }
          .rl-desk-logo{display:flex;align-items:center;gap:10px}
          .rl-desk-logo-icon{
            width:34px;height:34px;border-radius:10px;
            background:rgba(167,139,250,0.15);
            border:0.5px solid rgba(167,139,250,0.25);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;
          }
          .rl-desk-logo-t{font-size:13px;font-weight:700;color:#f0efff}
          .rl-desk-logo-s{font-size:10px;color:rgba(255,255,255,0.28);margin-top:1px}
          .rl-desk-badge{
            display:flex;align-items:center;gap:5px;
            font-size:11px;color:rgba(255,255,255,0.35);
            background:rgba(255,255,255,0.05);
            border:0.5px solid rgba(255,255,255,0.1);border-radius:20px;padding:5px 13px;
          }

          /* desktop hero */
          .rl-desk-hero{
            text-align:center;
            padding:52px 36px 36px;
            width:100%;max-width:960px;margin:0 auto;
            position:relative;overflow:hidden;
          }
          .rl-desk-hero::before{
            content:'';position:absolute;top:-80px;right:-80px;
            width:320px;height:320px;border-radius:50%;
            background:rgba(127,119,221,0.06);pointer-events:none;
          }
          .rl-desk-hero::after{
            content:'';position:absolute;bottom:-60px;left:-60px;
            width:220px;height:220px;border-radius:50%;
            background:rgba(59,100,220,0.05);pointer-events:none;
          }
          .rl-desk-pill{
            display:inline-flex;align-items:center;gap:6px;
            font-size:10px;font-weight:700;color:rgba(167,139,250,0.7);
            background:transparent;border:none;
            border-radius:20px;padding:4px 0;
            margin-bottom:12px;letter-spacing:0.12em;text-transform:uppercase;
          }
          .rl-desk-h1{
            font-size:clamp(28px,4vw,44px);font-weight:900;color:#fff;
            letter-spacing:-0.03em;line-height:1.15;margin-bottom:12px;
          }
          .rl-desk-h1 span{
            background:linear-gradient(90deg,#f97316,#f59e0b,#eab308);
            -webkit-background-clip:text;-webkit-text-fill-color:transparent;
            background-clip:text;
          }
          .rl-desk-desc{font-size:13px;color:rgba(255,255,255,0.28);line-height:1.75;max-width:460px;margin:0 auto}

          /* desktop 3-col grid */
          .rl-desk-cards{
            width:100%;max-width:960px;
            padding:0 36px 64px;
            margin:0 auto;
            display:grid;grid-template-columns:repeat(3,1fr);gap:16px;
          }
          .rl-desk-card{
            background:#fff;border:none;border-radius:20px;
            padding:24px;cursor:pointer;text-align:left;
            position:relative;overflow:hidden;
            display:flex;flex-direction:column;
            transition:transform 0.2s ease,box-shadow 0.2s ease;
            box-shadow:0 4px 24px rgba(0,0,0,0.18);
          }
          .rl-desk-card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,0.3)}
          .rl-desk-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:20px 20px 0 0}
          .rl-desk-icon{
            width:46px;height:46px;border-radius:13px;
            display:flex;align-items:center;justify-content:center;
            margin-bottom:16px;flex-shrink:0;
          }
          .rl-desk-type{
            display:inline-flex;font-size:9px;font-weight:700;
            padding:3px 9px;border-radius:20px;
            letter-spacing:0.04em;text-transform:uppercase;
            width:fit-content;margin-bottom:8px;
          }
          .rl-desk-title{font-size:18px;font-weight:800;color:#1a1825;margin-bottom:8px;letter-spacing:-0.01em}
          .rl-desk-desc-t{font-size:12px;color:#9c9a93;line-height:1.7;flex:1;margin-bottom:14px}
          .rl-desk-feats{display:flex;flex-direction:column;gap:6px;margin-bottom:18px}
          .rl-desk-feat{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#b4b2a9}
          .rl-desk-feat-dot{width:4px;height:4px;border-radius:50%;flex-shrink:0}
          .rl-desk-cta{
            display:flex;align-items:center;justify-content:center;gap:6px;
            border-radius:12px;padding:11px 14px;font-size:12.5px;font-weight:700;
            margin-top:auto;border:none;cursor:pointer;
            transition:opacity 0.15s ease;
          }
          .rl-desk-cta:hover{opacity:0.75}
          .rl-desk-footer{
            font-size:11px;color:rgba(255,255,255,0.18);text-align:center;
            padding-bottom:44px;display:flex;align-items:center;
            justify-content:center;gap:8px;
          }
          .rl-desk-footer-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.18)}
        }

        /* hide desktop elements on mobile */
        .rl-desk-nav,.rl-desk-hero,.rl-desk-cards,.rl-desk-footer{display:none}
        @media(min-width:768px){
          .rl-desk-nav,.rl-desk-hero,.rl-desk-cards,.rl-desk-footer{display:flex}
          .rl-desk-cards{display:grid}
          .rl-desk-hero,.rl-desk-footer{display:flex;flex-direction:column;align-items:center}
          .rl-desk-nav{display:flex}
        }
      `}</style>

      <div className="rl-root">

        {/* ══ MOBILE ══ */}
        <div className="rl-mob-header">
          <div className="rl-mob-circle1" />
          <div className="rl-mob-circle2" />
          <div className="rl-mob-logo">
            <div className="rl-mob-logo-icon">
              <svg width="15" height="15" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <div className="rl-mob-logo-t">IB Reimbursement</div>
              <div className="rl-mob-logo-s">Support Teambon VT Market</div>
            </div>
          </div>
          <div className="rl-mob-tag">ระบบขอเบิกค่าใช้จ่าย</div>
          <span className="rl-mob-h1-white">เลือกประเภท</span>
          <span className="rl-mob-h1-grad">การขอเบิก</span>
          <div className="rl-mob-divider">
            <div className="rl-mob-line" />
            <div className="rl-mob-subdesc">กรอกข้อมูลครบ รับอีเมลสำเร็จรูปทันที</div>
          </div>
        </div>

        <div className="rl-mob-cards">
          {cards.map(c => (
            <button key={c.id} className="rl-mob-card" onClick={() => router.push(c.route)}>
              <div className="rl-mob-icon" style={{ background: c.iconBg }}>
                {c.iconPath}
                <div className="rl-mob-dot" style={{ background: c.dotColor }} />
              </div>
              <div className="rl-mob-body">
                <div className="rl-mob-title">{c.title}</div>
                <div className="rl-mob-sub">{c.sub}</div>
              </div>
              <div className="rl-mob-arrow" style={{ background: c.arrowBg, border: `0.5px solid ${c.arrowBorder}` }}>
                <svg width="18" height="18" fill="none" stroke={c.arrowColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
          <div className="rl-mob-footer">
            <svg width="11" height="11" fill="none" stroke="#b4b2a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="rl-mob-footer-t">ไม่บันทึกข้อมูลใดๆ ทั้งสิ้น</span>
          </div>
        </div>

        {/* ══ DESKTOP ══ */}
        <nav className="rl-desk-nav">
          <div className="rl-desk-logo">
            <div className="rl-desk-logo-icon">
              <svg width="17" height="17" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <div className="rl-desk-logo-t">IB Reimbursement</div>
              <div className="rl-desk-logo-s">Support Teambon VT Market</div>
            </div>
          </div>
          <div className="rl-desk-badge">
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ไม่ต้อง Login
          </div>
        </nav>

        <section className="rl-desk-hero">
          <div className="rl-desk-pill">
            <svg width="7" height="7" fill="rgba(167,139,250,0.6)" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4"/></svg>
            ระบบขอเบิกค่าใช้จ่าย
          </div>
          <h1 className="rl-desk-h1">เลือกประเภท<span>การขอเบิก</span></h1>
          <p className="rl-desk-desc">กรอกข้อมูลให้ครบ ระบบจะสร้างอีเมลสำเร็จรูปให้ทันที<br/>พร้อมก็อปปี้ส่งได้เลย — ไม่บันทึกข้อมูลใดๆ</p>
        </section>

        <div className="rl-desk-cards">
          {cards.map(c => (
            <button key={`d-${c.id}`} className="rl-desk-card"
              onClick={() => router.push(c.route)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.deskBorder)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e6de")}
            >
              <div className="rl-desk-bar" style={{ background: `linear-gradient(90deg,${c.color},${c.dotColor})` }} />
              <div className="rl-desk-icon" style={{ background: c.deskBg, border: `0.5px solid ${c.deskBorder}` }}>
                {c.iconPathDesk}
              </div>
              <div className="rl-desk-type" style={{ background: c.deskBg, color: c.color, border: `0.5px solid ${c.deskBorder}` }}>
                {c.deskType}
              </div>
              <div className="rl-desk-title">{c.title}</div>
              <div className="rl-desk-desc-t">{c.desc}</div>
              <div className="rl-desk-feats">
                {c.features.map(f => (
                  <div className="rl-desk-feat" key={f}>
                    <div className="rl-desk-feat-dot" style={{ background: c.color }} />{f}
                  </div>
                ))}
              </div>
              <div className="rl-desk-cta" style={{ background: c.deskBg, color: c.color }}>
                เริ่มกรอกข้อมูล
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </button>
          ))}
        </div>

        <div className="rl-desk-footer">
          <span>กรอกข้อมูลแล้วก็อปปี้อีเมลไปส่งได้ทันที</span>
          <div className="rl-desk-footer-dot" />
          <span>ไม่บันทึกข้อมูลใดๆ ทั้งสิ้น</span>
        </div>

      </div>
    </>
  );
}
