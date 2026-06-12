"use client";

import { useState } from "react";
import {
  CATEGORIES,
  CATEGORY_STYLE,
  ShowcaseItem,
  FilterKey,
  driveThumb,
} from "./data";

// ─── CARD ────────────────────────────────────────────────────────────────────
function ShowcaseCard({ item }: { item: ShowcaseItem }) {
  // Try the local file in /public/showcase first, then fall back to the Drive
  // thumbnail (if any), then finally a gradient placeholder if neither loads.
  const sources = [`/showcase/${item.file}`, item.driveId ? driveThumb(item.driveId) : null].filter(
    (s): s is string => Boolean(s)
  );
  const [srcIndex, setSrcIndex] = useState(0);
  const style = CATEGORY_STYLE[item.category];
  const exhausted = srcIndex >= sources.length;

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-900/40">
      <div className="relative aspect-square overflow-hidden bg-gray-950">
        {!exhausted && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sources[srcIndex]}
            alt={item.title}
            onError={() => setSrcIndex((i) => i + 1)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
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
        {/* subtle bottom gradient for depth */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md ${style.badgeDark}`}
        >
          {style.label}
        </span>
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function ShowcaseClient({ items }: { items: ShowcaseItem[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12 sm:mb-16">
          <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-gray-500">
            Support Teambon
          </span>
        </div>

        {/* Hero */}
        <div className="text-center mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] uppercase mb-6 text-purple-300">
            <span className="h-px w-8 bg-current opacity-60" />
            Selected Works
            <span className="h-px w-8 bg-current opacity-60" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-5 text-white">
            ตัวอย่าง
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
              ผลงาน
            </span>
            ของเรา
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-gray-400">
            รวมผลงานกราฟิกดีไซน์ EA, โปรโมชั่น และสัมมนา ที่ทีมงานออกแบบ
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 sm:mb-16">
          {CATEGORIES.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`text-sm font-medium px-4 sm:px-5 py-2 rounded-full border transition-all duration-300 flex items-center gap-1.5 ${
                  active
                    ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white border-transparent shadow-lg shadow-purple-500/30 scale-105"
                    : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-purple-500/50 hover:text-purple-300"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((item) => (
            <ShowcaseCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center mt-12 text-sm text-gray-500">ยังไม่มีผลงานในหมวดนี้</p>
        )}

        {/* CTA */}
        <div className="mt-16 sm:mt-24 rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-500 shadow-xl shadow-purple-900/30">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            สนใจงานกราฟิก/วิดีโอแบบนี้?
          </h2>
          <p className="text-purple-100 text-sm sm:text-base">
            ติดต่อทีมงานเพื่อขอดูผลงานเพิ่มเติมได้
          </p>
        </div>
      </div>
    </div>
  );
}
