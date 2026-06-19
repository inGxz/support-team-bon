"use client";

import Link from "next/link";

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2h16v20l-2-2-2 2-2-2-2 2-2-2-2 2V2z"/>
      <line x1="8" y1="8" x2="16" y2="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

function IconBulb({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="3"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="2" y1="12" x2="3" y2="12"/>
      <line x1="19.78" y1="4.22" x2="18.36" y2="5.64"/>
      <line x1="22" y1="12" x2="21" y2="12"/>
      <path d="M9 21h6M12 3a7 7 0 0 1 4 12.74V17H8v-1.26A7 7 0 0 1 12 3z"/>
    </svg>
  );
}

function IconGallery({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

/* ── Card data ──────────────────────────────────────────────────────────── */
const CARDS = [
  {
    href: "/reimbursement",
    Icon: IconReceipt,
    title: "เบิกค่าใช้จ่าย",
    subtitle: "Ads · Merch · ส่วนตัว",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-500",
    titleColor: "text-pink-600",
  },
  {
    href: "/idea",
    Icon: IconBulb,
    title: "ส่งไอเดีย",
    subtitle: "VT Idea Hub",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-500",
    titleColor: "text-purple-600",
  },
  {
    href: "/showcase",
    Icon: IconGallery,
    title: "ผลงาน",
    subtitle: "Showcase Gallery",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-600",
  },
];

/* ── Stats ──────────────────────────────────────────────────────────────── */
const STATS = [
  { value: "12", label: "ไอเดีย",      color: "text-purple-500" },
  { value: "3",  label: "เบิกดำเนิน",  color: "text-pink-500"   },
  { value: "28", label: "ผลงาน",       color: "text-emerald-500" },
];

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function TeamPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#6d28d9 100%)" }}
      >
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-6 -right-6 w-44 h-44 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative text-center px-6 pt-8 pb-12">
          <h1 className="text-xl font-black tracking-widest uppercase text-white">VT MARKETS</h1>
          <p className="text-purple-200 text-xs tracking-widest mt-0.5">Team Portal</p>
        </div>

        {/* wave */}
        <svg viewBox="0 0 375 28" className="absolute bottom-0 left-0 w-full" preserveAspectRatio="none" style={{ height: 28 }}>
          <path d="M0,14 C93,28 282,0 375,14 L375,28 L0,28 Z" fill="#f9fafb" />
        </svg>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-5 pb-24 space-y-3">

        {/* Greeting */}
        <div className="pb-1">
          <p className="text-gray-400 text-sm">สวัสดีค่ะ ทีมงาน 👋</p>
          <p className="text-gray-800 text-base font-semibold mt-0.5">เลือกบริการที่ต้องการ</p>
        </div>

        {/* Cards */}
        {CARDS.map(({ href, Icon, title, subtitle, iconBg, iconColor, titleColor }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${titleColor}`}>{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
            </div>
            <svg className="text-gray-300 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-2">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Quick Stats</p>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {STATS.map(({ value, label, color }) => (
              <div key={label} className="text-center px-2">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom Nav ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-lg">
        <div className="grid grid-cols-3 py-2">
          <button className="flex flex-col items-center gap-0.5 py-1">
            <IconHome className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] font-semibold text-purple-600">หน้าแรก</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 py-1">
            <IconBell className="w-5 h-5 text-gray-300" />
            <span className="text-[10px] text-gray-300">แจ้งเตือน</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 py-1">
            <IconUser className="w-5 h-5 text-gray-300" />
            <span className="text-[10px] text-gray-300">โปรไฟล์</span>
          </button>
        </div>
      </div>

    </div>
  );
}
