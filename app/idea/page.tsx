"use client";

import { useState } from "react";

const SCRIPT_URL = "/api/gas";

const OBJECTIVES = [
  { key: "เพิ่มลูกค้า",    icon: "👥" },
  { key: "เพิ่ม Brand",    icon: "✨" },
  { key: "เพิ่ม Engagement", icon: "❤️" },
  { key: "ลดงาน",          icon: "⚡" },
  { key: "เพิ่มรายได้",   icon: "💰" },
  { key: "Morale ทีม",    icon: "🎉" },
];

const DEPARTMENTS = ["Sales", "MKT", "CS", "Admin", "HR"];

const ADMIN_NAMES = ["ING", "NAT", "FEW", "BON"];

type Step = 1 | 2 | 3;

export default function IdeaPage() {
  const [step, setStep] = useState<Step>(1);

  // form fields
  const [idea, setIdea] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [pm, setPm] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggleItem = (arr: string[], set: (v: string[]) => void, key: string) => {
    set(arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key]);
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!idea.trim()) { setError("กรุณาเขียนไอเดียของคุณก่อนนะคะ"); return; }
      setStep(2);
    } else if (step === 2) {
      if (objectives.length === 0) { setError("เลือกวัตถุประสงค์อย่างน้อย 1 ข้อค่ะ"); return; }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (departments.length === 0) { setError("เลือกแผนกที่ต้อง support อย่างน้อย 1 แผนกค่ะ"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          type: "idea_submit",
          idea: idea.trim(),
          objectives: objectives.join(", "),
          departments: departments.join(", "),
          pm: pm.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้งค่ะ");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setIdea(""); setObjectives([]); setDepartments([]); setPm("");
    setError(""); setStep(1); setDone(false);
  };

  // ── DONE SCREEN ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="text-6xl">💡</div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">ขอบคุณมากเลย!</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              ไอเดียของคุณถูกส่งถึงทีม VT เรียบร้อยแล้ว<br />
              เราจะนำไปพิจารณาและพัฒนาต่อไปนะคะ ✨
            </p>
          </div>
          <button
            onClick={resetAll}
            className="mt-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-500 text-sm hover:bg-gray-100 transition"
          >
            ส่งไอเดียอีกอัน
          </button>
        </div>
      </main>
    );
  }

  const chipCls = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition cursor-pointer select-none ${
      active
        ? "bg-purple-50 border-purple-400 text-purple-700"
        : "bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:text-purple-600"
    }`;

  const deptCls = (active: boolean) =>
    `px-4 py-2 rounded-xl border text-sm font-medium transition cursor-pointer select-none ${
      active
        ? "bg-purple-50 border-purple-400 text-purple-700"
        : "bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:text-purple-600"
    }`;

  const inputCls =
    "w-full p-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-300 outline-none transition bg-white";

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700" />
          <div className="absolute -top-8 -left-8 w-36 h-36 bg-purple-400/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-indigo-400/30 rounded-full blur-2xl" />
          <div className="relative px-8 py-8 text-center">
            <span className="text-4xl">💡</span>
            <h1 className="text-2xl font-black tracking-widest uppercase text-white mt-2">VT Idea Hub</h1>
            <p className="text-purple-100 text-sm mt-1">มีไอเดียดีๆ แชร์ให้ทีม VT รู้ด้วยกันเลย</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  step >= s ? "bg-purple-500" : "bg-gray-200"
                }`}
              />
              <span className={`text-xs ${step >= s ? "text-purple-600 font-semibold" : "text-gray-400"}`}>
                {s === 1 ? "ไอเดีย" : s === 2 ? "วัตถุประสงค์" : "แผนก"}
              </span>
            </div>
          ))}
        </div>

        {/* ── STEP 1: ไอเดีย ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">💡 มีไอเดียอะไร?</h2>
              <p className="text-xs text-gray-400 mt-1">ไม่ต้องระบุชื่อ — เปิดกว้างสำหรับทุกคน</p>
            </div>
            <textarea
              className={inputCls + " h-32 resize-none"}
              placeholder="เขียนไอเดียของคุณได้เลยค่ะ..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">{idea.length}/500</span>
            </div>
            {/* Quick examples */}
            <div>
              <p className="text-xs text-gray-400 mb-2">ตัวอย่างไอเดีย:</p>
              <div className="flex flex-wrap gap-2">
                {["อยากมี Podcast", "ออกบูธมหาลัย", "มี mascot ของ VT", "AI ตอบลูกค้า", "แจกเสื้อทุกไตรมาส"].map(
                  (ex) => (
                    <button
                      key={ex}
                      onClick={() => setIdea(ex)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition"
                    >
                      {ex}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: วัตถุประสงค์ ────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🎯 วัตถุประสงค์</h2>
              <p className="text-xs text-gray-400 mt-1">ไอเดียนี้ช่วยอะไรได้บ้าง? เลือกได้หลายข้อ</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {OBJECTIVES.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => toggleItem(objectives, setObjectives, key)}
                  className={chipCls(objectives.includes(key))}
                >
                  <span>{icon}</span>
                  <span>{key}</span>
                </button>
              ))}
            </div>
            {/* recap */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">ไอเดียของคุณ:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{idea}</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: แผนก + PM ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🏢 แผนกที่ต้อง support</h2>
              <p className="text-xs text-gray-400 mt-1">ไอเดียนี้ต้องการแผนกไหนมาช่วย? เลือกได้หลายแผนก</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => toggleItem(departments, setDepartments, dept)}
                  className={deptCls(departments.includes(dept))}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-4 space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Project Manager ที่อยากให้รับผิดชอบ{" "}
                <span className="text-xs text-gray-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <select
                className={inputCls}
                value={pm}
                onChange={(e) => setPm(e.target.value)}
              >
                <option value="">— เลือก PM —</option>
                {ADMIN_NAMES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* recap */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1">
              <p className="text-xs text-gray-400">สรุปก่อนส่ง:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{idea}</p>
              {objectives.length > 0 && (
                <p className="text-xs text-purple-600">🎯 {objectives.join(" · ")}</p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm px-1">⚠️ {error}</p>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => { setError(""); setStep((s) => (s - 1) as Step); }}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition"
            >
              ← ย้อนกลับ
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white text-sm font-bold shadow-md hover:scale-[1.01] transition"
            >
              ถัดไป →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white text-sm font-bold shadow-md hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="animate-spin">⏳</span> กำลังส่ง...</>
              ) : (
                "✅ ส่งไอเดีย"
              )}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
