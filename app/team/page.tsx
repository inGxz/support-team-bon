"use client";

import Link from "next/link";

const CARDS = [
  {
    href: "/reimbursement",
    emoji: "🧾",
    title: "เบิกค่าใช้จ่าย",
    subtitle: "Ads · Merch · ส่วนตัว",
    bg: "bg-pink-50",
    border: "border-pink-200",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    textColor: "text-pink-700",
  },
  {
    href: "/idea",
    emoji: "💡",
    title: "ส่งไอเดีย",
    subtitle: "VT Idea Hub",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    textColor: "text-purple-700",
  },
  {
    href: "/showcase",
    emoji: "🖼️",
    title: "ผลงานทีม",
    subtitle: "Showcase Gallery",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-700",
  },
];

export default function TeamPortalPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#6d28d9 100%)" }}
      >
        {/* decorative blobs */}
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative text-center px-6 pt-10 pb-14">
          <div className="text-5xl mb-3">💜</div>
          <h1 className="text-2xl font-black tracking-widest uppercase text-white">VT MARKETS</h1>
          <p className="text-purple-200 text-sm tracking-widest mt-1">Team Portal</p>
        </div>

        {/* wave */}
        <svg
          viewBox="0 0 375 32"
          className="absolute bottom-0 left-0 w-full"
          preserveAspectRatio="none"
          style={{ height: 32 }}
        >
          <path d="M0,16 C93,32 282,0 375,16 L375,32 L0,32 Z" fill="#f3f4f6" />
        </svg>
      </div>

      {/* Greeting */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-gray-400 text-sm">สวัสดีค่ะ ทีมงาน 👋</p>
        <p className="text-gray-800 text-base font-semibold mt-0.5">เลือกบริการที่ต้องการ</p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-5 pt-2 pb-8 space-y-3">
        {CARDS.map(({ href, emoji, title, subtitle, bg, border, iconBg, iconColor, textColor }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 p-4 rounded-2xl border ${bg} ${border} active:scale-[0.98] transition-transform`}
          >
            <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-base ${textColor}`}>{title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
            </div>
            <svg className="text-gray-300 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 pt-2">
        <p className="text-gray-300 text-xs">© 2026 VT Markets · Team Portal</p>
      </div>

    </main>
  );
}
