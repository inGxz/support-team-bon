"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CATEGORIES,
  CATEGORY_STYLE,
  ShowcaseItem,
  FilterKey,
  driveThumb,
} from "./data";

// ─── CARD ────────────────────────────────────────────────────────────────────
function ShowcaseCard({ item, dark }: { item: ShowcaseItem; dark: boolean }) {
  // Try the local file in /public/showcase first, then fall back to the Drive
  // thumbnail (if any), then finally a gradient placeholder if neither loads.
  const sources = [`/showcase/${item.file}`, item.driveId ? driveThumb(item.driveId) : null].filter(
    (s): s is string => Boolean(s)
  );
  const [srcIndex, setSrcIndex] = useState(0);
  const style = CATEGORY_STYLE[item.category];
  const exhausted = srcIndex >= sources.length;

  return (
    <div
      className={`group rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-shadow ${
        dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
      }`}
    >
      <div
        className={`relative aspect-square overflow-hidden ${
          dark ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {!exhausted && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sources[srcIndex]}
            alt={item.title}
            onError={() => setSrcIndex((i) => i + 1)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {exhausted && (
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
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ShowcaseClient({ items }: { items: ShowcaseItem[] }) {
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
  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

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
