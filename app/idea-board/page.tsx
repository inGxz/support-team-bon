"use client";

import { useEffect, useState } from "react";

type Idea = {
  timestamp: string;
  id: string;
  category: string;
  idea: string;
  objectives: string;
  departments: string;
  pm: string;
};

const DEPT_COLOR: Record<string, string> = {
  Sales: "bg-blue-100 text-blue-700 border-blue-200",
  MKT:   "bg-pink-100 text-pink-700 border-pink-200",
  CS:    "bg-green-100 text-green-700 border-green-200",
  Admin: "bg-amber-100 text-amber-700 border-amber-200",
  HR:    "bg-purple-100 text-purple-700 border-purple-200",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function IdeaBoardPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword]     = useState("");
  const [pwError, setPwError]       = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("ideaBoardAuth");
    if (saved) setIsLoggedIn(true);
  }, []);

  const handleLogin = async () => {
    if (!password) return;
    setAuthLoading(true);
    setPwError(false);
    try {
      const res  = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("ideaBoardAuth", password);
        setIsLoggedIn(true);
      } else {
        setPwError(true);
      }
    } catch {
      setPwError(true);
    }
    setAuthLoading(false);
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const [ideas, setIdeas]   = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    (async () => {
      try {
        const res  = await fetch("/api/gas?action=idea_list");
        const data = await res.json();
        if (Array.isArray(data.ideas)) setIdeas(data.ideas);
        else setError("ไม่สามารถโหลดข้อมูลได้");
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoggedIn]);

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo card */}
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700" />
            <div className="absolute -top-8 -left-8 w-36 h-36 bg-purple-400/30 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-indigo-400/30 rounded-full blur-2xl" />
            <div className="relative px-8 py-7 text-center">
              <span className="text-4xl">💡</span>
              <h1 className="text-xl font-black tracking-widest uppercase text-white mt-2">VT Idea Board</h1>
              <p className="text-purple-200 text-xs mt-1">สำหรับทีมงาน VT Markets</p>
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {/* Name (display only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">ชื่อผู้ใช้</label>
              <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium">
                Admin Bon
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">รหัสผ่าน</label>
              <input
                type="password"
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 text-sm outline-none transition focus:ring-2 focus:ring-purple-300 ${
                  pwError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                }`}
                placeholder="กรอกรหัสผ่าน..."
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus
              />
              {pwError && (
                <p className="text-xs text-red-500">⚠️ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่</p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={authLoading || !password}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white text-sm font-bold shadow-md hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? <><span className="animate-spin">⏳</span> กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ →"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── BOARD ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700" />
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -right-8 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide">VT Idea Board</h1>
                <p className="text-purple-200 text-sm mt-0.5">ไอเดียทั้งหมดจากลูกค้า VT Markets</p>
              </div>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem("ideaBoardAuth"); setIsLoggedIn(false); }}
              className="text-xs text-purple-200 hover:text-white transition px-3 py-1.5 rounded-full border border-purple-400/40 hover:border-purple-300"
            >
              ออกจากระบบ
            </button>
          </div>
          {!loading && !error && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
              <span className="text-white text-sm font-semibold">{ideas.length}</span>
              <span className="text-purple-200 text-sm">ไอเดีย</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-6">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-3xl animate-spin">⏳</span>
            <p className="text-gray-400 text-sm">กำลังโหลด...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💭</p>
            <p className="text-gray-400 text-sm">ยังไม่มีไอเดียที่ส่งเข้ามา</p>
          </div>
        )}

        {!loading && ideas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideas.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 hover:shadow-md transition"
              >
                {/* Top row: category + date */}
                <div className="flex items-start justify-between gap-2">
                  {item.category ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                      {item.category}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs">
                      ไม่ระบุหมวด
                    </span>
                  )}
                  <span className="text-xs text-gray-300 shrink-0">{formatDate(item.timestamp)}</span>
                </div>

                {/* Idea text */}
                <div className="bg-yellow-50 rounded-xl px-3 py-2 border border-yellow-200">
                  <p className="text-xs text-yellow-600 font-semibold mb-1">💡 ไอเดีย</p>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">{item.idea}</p>
                </div>

                {/* Objectives */}
                {item.objectives && (
                  <div className="bg-indigo-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-indigo-400 font-semibold mb-1">🎯 วัตถุประสงค์</p>
                    <p className="text-xs text-indigo-700 leading-relaxed">{item.objectives}</p>
                  </div>
                )}

                {/* Departments */}
                {item.departments && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.departments.split(",").map((d) => d.trim()).filter(Boolean).map((dept) => (
                      <span
                        key={dept}
                        className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${DEPT_COLOR[dept] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                )}

                {/* PM */}
                {item.pm && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50">
                    <span className="text-xs text-gray-400">PM:</span>
                    <span className="text-xs text-gray-600 font-medium">{item.pm}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
