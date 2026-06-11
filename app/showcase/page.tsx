"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type CategoryKey = "ea" | "promotion" | "seminar" | "concept";
type FilterKey = "all" | CategoryKey;

type ShowcaseItem = {
  id: number;
  file: string; // expects file under /public/showcase/<file>
  title: string;
  subtitle: string;
  category: CategoryKey;
};

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────
const CATEGORIES: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "ทั้งหมด", icon: "✨" },
  { key: "ea", label: "EA / ระบบเทรดอัตโนมัติ", icon: "🤖" },
  { key: "promotion", label: "โปรโมชั่น", icon: "🎁" },
  { key: "seminar", label: "สัมมนา / กิจกรรม", icon: "🎤" },
  { key: "concept", label: "Mindset & Knowledge", icon: "💡" },
];

const CATEGORY_STYLE: Record<
  CategoryKey,
  { gradient: string; badgeLight: string; badgeDark: string; label: string }
> = {
  ea: {
    gradient: "from-purple-500 via-indigo-500 to-purple-400",
    badgeLight: "bg-purple-100 text-purple-700",
    badgeDark: "bg-purple-500/20 text-purple-300",
    label: "EA / Bot",
  },
  promotion: {
    gradient: "from-pink-500 via-rose-400 to-orange-300",
    badgeLight: "bg-pink-100 text-pink-700",
    badgeDark: "bg-pink-500/20 text-pink-300",
    label: "โปรโมชั่น",
  },
  seminar: {
    gradient: "from-amber-500 via-orange-400 to-yellow-300",
    badgeLight: "bg-amber-100 text-amber-700",
    badgeDark: "bg-amber-500/20 text-amber-300",
    label: "สัมมนา",
  },
  concept: {
    gradient: "from-teal-500 via-emerald-400 to-cyan-300",
    badgeLight: "bg-teal-100 text-teal-700",
    badgeDark: "bg-teal-500/20 text-teal-300",
    label: "Mindset",
  },
};

// ─── CONTENT ─────────────────────────────────────────────────────────────────
// Drop matching image files into /public/showcase/ — file names below are the
// expected names. Until a file exists, a gradient placeholder is shown instead.
const ITEMS: ShowcaseItem[] = [
  {
    id: 1,
    file: "ea-shadow-hedge.png",
    title: "EA Shadow Hedge",
    subtitle: "เทรดอย่างมั่นใจ กับระบบเทรดอัตโนมัติทรงพลัง",
    category: "ea",
  },
  {
    id: 2,
    file: "ea-super-grid.png",
    title: "กลยุทธ์ Super Grid",
    subtitle: "EA ระบบ Grid + Hedging โอกาสทำกำไรไม่จำกัดล็อต",
    category: "ea",
  },
  {
    id: 3,
    file: "ea-shadow-grid-ultimate.png",
    title: "Shadow Grid Ultimate",
    subtitle: "ระบบเทรดอัตโนมัติเวอร์ชันอัปเกรด พร้อมใช้งานฟรี",
    category: "ea",
  },
  {
    id: 4,
    file: "promo-copy-trading.png",
    title: "Copy Trading",
    subtitle: "เจาะลึกโซนซื้อ-ขาย ด้วย Demand & Supply",
    category: "promotion",
  },
  {
    id: 5,
    file: "promo-kru-mam.png",
    title: "โปรโมชั่นพิเศษ ครูแหม่ม",
    subtitle: "ติดตามเทคนิคการเทรดจากผู้เชี่ยวชาญตัวจริง",
    category: "promotion",
  },
  {
    id: 6,
    file: "promo-trade.png",
    title: "Promotion เทรดทอง",
    subtitle: "ข้อเสนอพิเศษสำหรับนักเทรดทอง (Gold)",
    category: "promotion",
  },
  {
    id: 7,
    file: "seminar-demand-supply.png",
    title: "เข้าห้อง...จบในโน้ต",
    subtitle: "Workshop เจาะลึก Demand & Supply กับ VT Markets",
    category: "seminar",
  },
  {
    id: 8,
    file: "seminar-pro-trader.png",
    title: "เริ่มเทรดแบบมือโปร",
    subtitle: "ปูพื้นฐานการเทรดอย่างเป็นระบบตั้งแต่ก้าวแรก",
    category: "seminar",
  },
  {
    id: 9,
    file: "seminar-vt-life.png",
    title: "ชีวิตติดเทรด",
    subtitle: "แรงบันดาลใจจากนักเทรดจริงกับ VT Markets",
    category: "seminar",
  },
  {
    id: 10,
    file: "concept-mindset.png",
    title: "Mindset",
    subtitle: "ทัศนคติและวิธีคิดของนักเทรดมืออาชีพ",
    category: "concept",
  },
  {
    id: 11,
    file: "concept-money-management.png",
    title: "Money Management",
    subtitle: "การบริหารเงินทุนเพื่อการเทรดอย่างยั่งยืน",
    category: "concept",
  },
  {
    id: 12,
    file: "concept-3m.png",
    title: "3M คืออะไร?",
    subtitle: "Mindset, Money Management, Method — 3 เสาหลักของนักเทรด",
    category: "concept",
  },
];

// ─── CARD ────────────────────────────────────────────────────────────────────
function ShowcaseCard({ item, dark }: { item: ShowcaseItem; dark: boolean }) {
  const [imgError, setImgError] = useState(false);
  const style = CATEGORY_STYLE[item.category];

  return (
    <div
      className={`group rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-shadow ${
        dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <div className="relative aspect-video overflow-hidden">
        {!imgError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/showcase/${item.file}`}
            alt={item.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {imgError && (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${style.gradient}`}
          >
            <span className="text-5xl drop-shadow-md">
              {CATEGORIES.find((c) => c.key === item.category)?.icon}
            </span>
          </div>
        )}
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${
            dark ? style.badgeDark : style.badgeLight
          }`}
        >
          {style.label}
        </span>
      </div>
      <div className="p-4">
        <h3
          className={`font-semibold text-sm mb-1 ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          {item.title}
        </h3>
        <p
          className={`text-xs leading-relaxed ${
            dark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {item.subtitle}
        </p>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ShowcasePage() {
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      if (saved) setDark(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleDark = () => {
    setDark((d) => {
      try {
        localStorage.setItem("darkMode", JSON.stringify(!d));
      } catch {}
      return !d;
    });
  };

  const bg = dark ? "bg-gray-900" : "bg-gray-50";
  const filtered = filter === "all" ? ITEMS : ITEMS.filter((i) => i.category === filter);

  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className={`text-sm font-semibold flex items-center gap-1 transition ${
              dark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            ← กลับหน้าหลัก
          </Link>
          <button
            onClick={toggleDark}
            className={`text-sm px-3 py-1.5 rounded-lg border transition ${
              dark
                ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                : "border-gray-200 text-gray-500 hover:bg-white"
            }`}
          >
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white shadow-md`}
          >
            🎨 Portfolio
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold mb-2 ${
              dark ? "text-white" : "text-gray-900"
            }`}
          >
            ตัวอย่างผลงานของเรา
          </h1>
          <p className={`text-sm sm:text-base ${dark ? "text-gray-400" : "text-gray-500"}`}>
            รวมผลงานกราฟิกดีไซน์ EA, โปรโมชั่น และสัมมนา ที่ทีมงานออกแบบ
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`text-sm font-medium px-4 py-2 rounded-full border transition flex items-center gap-1.5 ${
                  active
                    ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white border-transparent shadow-md"
                    : dark
                    ? "border-gray-700 text-gray-300 hover:border-purple-400 hover:text-purple-300"
                    : "border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 bg-white"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ShowcaseCard key={item.id} item={item} dark={dark} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className={`text-center mt-12 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
            ยังไม่มีผลงานในหมวดนี้
          </p>
        )}

        {/* Footer note */}
        <div
          className={`mt-14 text-center text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}
        >
          สนใจงานกราฟิก/วิดีโอแบบนี้ ติดต่อทีมงานเพื่อขอดูผลงานเพิ่มเติมได้
        </div>
      </div>
    </div>
  );
}
