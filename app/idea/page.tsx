"use client";

import { useState } from "react";

const SCRIPT_URL = "/api/gas";

// ── ประเภทไอเดีย ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "แพลตฟอร์ม & เทคโนโลยี", icon: "📱" },
  { key: "ความรู้ & การศึกษา",      icon: "📚" },
  { key: "โปรโมชัน & รางวัล",       icon: "🎁" },
  { key: "สินค้า & ตลาดใหม่",       icon: "🌍" },
  { key: "ชุมชน & Event",           icon: "🤝" },
  { key: "แบรนด์ & Marketing",      icon: "✨" },
  { key: "บริการลูกค้า",            icon: "💬" },
  { key: "อื่นๆ",                   icon: "💡" },
];

// ── ตัวอย่างไอเดีย จัดกลุ่ม ──────────────────────────────────────────────────
const EXAMPLE_GROUPS = [
  {
    label: "แพลตฟอร์ม & เทคโนโลยี",
    examples: [
      "อยากมี AI ตอบลูกค้า",
      "อยากมี Copy Trading",
      "อยากมี Signal Service ในแอป",
      "อยากมี Economic Calendar ในแอป",
      "อยากให้แอปมี Dark Mode",
      "อยากให้แจ้งเตือน Price Alert ได้",
      "อยากให้เพิ่ม Crypto Pairs มากขึ้น",
    ],
  },
  {
    label: "ความรู้ & การศึกษา",
    examples: [
      "อยากมี Podcast",
      "อยากให้มี YouTube Channel สอนเทรด",
      "อยากให้มี Webinar รายเดือน",
      "อยากให้มี Daily Market Update ทุกวัน",
      "อยากให้มีคอร์สมือใหม่ฟรี",
      "อยากให้มี Newsletter รายสัปดาห์",
    ],
  },
  {
    label: "ชุมชน & Event",
    examples: [
      "อยากให้ VT ไปออกบูธมหาลัย",
      "อยากให้ออกบูธงาน Money Expo",
      "อยากให้จัด Trading Competition",
      "อยากให้มี Meetup เทรดเดอร์รายเดือน",
      "อยากมีกลุ่ม Discord / LINE เทรดเดอร์",
      "อยากให้มี Brand Ambassador",
    ],
  },
  {
    label: "แบรนด์ & Marketing",
    examples: [
      "อยากให้มี Mascot ของ VT",
      "อยากให้มี TikTok Official",
      "อยากให้มี Sticker LINE VT",
      "อยากให้ VT Sponsor ทีมกีฬา",
      "อยากให้มีหน้า Testimonial ลูกค้าจริง",
    ],
  },
  {
    label: "โปรโมชัน & Loyalty",
    examples: [
      "อยากให้แจกเสื้อทุกไตรมาส",
      "อยากให้มีโปรแนะนำเพื่อนรับเงินจริง",
      "อยากให้มีระบบ Points สะสม",
      "อยากให้มี VIP Tier สำหรับลูกค้าเก่า",
      "อยากให้มีของที่ระลึก VT Merchandise",
      "อยากให้มีโบนัสฝากครั้งแรก",
    ],
  },
  {
    label: "บริการลูกค้า",
    examples: [
      "อยากให้มี Live Chat ตลอด 24 ชั่วโมง",
      "อยากให้มี Support ภาษาไทย",
      "อยากให้มี FAQ ครบกว่าเดิม",
      "อยากให้มี Video Tutorial วิธีเปิดบัญชี",
    ],
  },
];

// ── วัตถุประสงค์ ──────────────────────────────────────────────────────────────
const OBJECTIVES = [
  { key: "ดึงดูดนักลงทุนใหม่",    icon: "🚀", sub: "เพิ่มฐานลูกค้า, referral" },
  { key: "รักษาลูกค้าเดิม",       icon: "❤️", sub: "loyalty, retention" },
  { key: "สร้างแบรนด์",           icon: "✨", sub: "ภาพลักษณ์, การรับรู้" },
  { key: "เพิ่ม Engagement",      icon: "🔥", sub: "social, กิจกรรม, interaction" },
  { key: "พัฒนาแพลตฟอร์ม",       icon: "📱", sub: "app, tools, ระบบเทรด" },
  { key: "ขยายสินค้า & ตลาด",    icon: "🌍", sub: "asset ใหม่, คู่เงิน, crypto" },
  { key: "ส่งเสริมความรู้",       icon: "📚", sub: "webinar, บทความ, education" },
  { key: "ยกระดับบริการ",         icon: "😊", sub: "support เร็วขึ้น, ง่ายขึ้น" },
  { key: "สร้างชุมชนเทรดเดอร์",   icon: "🤝", sub: "network, forum, copy trading" },
  { key: "เพิ่มความน่าเชื่อถือ",  icon: "🔒", sub: "transparency, security" },
  { key: "ขยายตลาดใหม่",          icon: "🌏", sub: "ประเทศใหม่, ภาษาใหม่" },
  { key: "อื่นๆ",                 icon: "💡", sub: "ไม่ตรงข้างบนเลย" },
];

type Step = 1 | 2 | 3;

export default function IdeaPage() {
  const [step, setStep] = useState<Step>(1);

  // step 1
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedExamples, setSelectedExamples] = useState<string[]>([]);
  const [idea, setIdea] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const toggleCategory = (key: string) =>
    setCategories((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const toggleExample = (ex: string) =>
    setSelectedExamples((p) => (p.includes(ex) ? p.filter((k) => k !== ex) : [...p, ex]));

  // ค่าที่จะส่ง = ชิปที่เลือก + ข้อความที่พิมพ์เพิ่ม
  const ideaValue = [...selectedExamples, idea.trim()].filter(Boolean).join(" / ");

  // step 2
  const [objectives, setObjectives] = useState<string[]>([]);

  // step 3
  const [departments, setDepartments] = useState<string[]>([]);
  const [pm, setPm] = useState("");

  // ui
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggleObj = (key: string) =>
    setObjectives((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!ideaValue) { setError("กรุณาเขียนหรือเลือกไอเดียของคุณก่อนนะคะ"); return; }
      setStep(2);
    } else if (step === 2) {
      if (objectives.length === 0) { setError("เลือกวัตถุประสงค์อย่างน้อย 1 ข้อค่ะ"); return; }
      setStep(3);
    }
  };

  const toggleDept = (key: string) =>
    setDepartments((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const handleSubmit = async () => {
    setError("");
    if (departments.length === 0) { setError("เลือกแผนกที่ต้อง support อย่างน้อย 1 แผนกค่ะ"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          type: "idea_submit",
          category: categories.join(", "),
          idea: ideaValue,
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
    setCategories([]); setSelectedExamples([]); setIdea(""); setObjectives([]); setDepartments([]); setPm("");
    setError(""); setStep(1); setDone(false); setOpenGroup(null);
  };

  // ── DONE ──────────────────────────────────────────────────────────────────────
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
            className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-500 text-sm hover:bg-gray-100 transition"
          >
            ส่งไอเดียอีกอัน
          </button>
        </div>
      </main>
    );
  }

  const chipCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition cursor-pointer select-none ${
      active
        ? "bg-purple-50 border-purple-400 text-purple-700"
        : "bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:text-purple-600"
    }`;

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700" />
          <div className="absolute -top-8 -left-8 w-36 h-36 bg-purple-400/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-indigo-400/30 rounded-full blur-2xl" />
          <div className="relative px-8 py-7 text-center">
            <span className="text-4xl">💡</span>
            <h1 className="text-2xl font-black tracking-widest uppercase text-white mt-2">VT Idea Hub</h1>
            <p className="text-purple-100 text-sm mt-1">มีไอเดียดีๆ แชร์ให้ทีม VT รู้ด้วยกันเลย</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all ${step >= s ? "bg-purple-500" : "bg-gray-200"}`} />
              <span className={`text-xs ${step >= s ? "text-purple-600 font-semibold" : "text-gray-400"}`}>
                {s === 1 ? "ไอเดีย" : s === 2 ? "วัตถุประสงค์" : "เพิ่มเติม"}
              </span>
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">💡 มีไอเดียอะไร?</h2>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">ไอเดียนี้เกี่ยวกับด้านไหน? <span className="text-gray-400 font-normal">(เลือกได้หลายด้าน)</span></p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={chipCls(categories.includes(key))}
                  >
                    <span>{icon}</span>
                    <span>{key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Free-text */}
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-2">เขียนไอเดียของคุณ</p>
              <textarea
                className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-300 outline-none transition bg-white h-28 resize-none"
                placeholder="เขียนได้เลยค่ะ เช่น อยากให้ VT มี..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-300">{idea.length}/500</span>
              </div>
            </div>

            {/* Example chips by group */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-semibold">หรือเลือกจากตัวอย่างด้านล่าง <span className="text-gray-400 font-normal">(เลือกได้หลายข้อ)</span></p>
                {selectedExamples.length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                    เลือกแล้ว {selectedExamples.length} ข้อ
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {EXAMPLE_GROUPS.map(({ label, examples }) => {
                  const selectedCount = examples.filter((ex) => selectedExamples.includes(ex)).length;
                  return (
                    <div key={label} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenGroup((p) => (p === label ? null : label))}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {label}
                          {selectedCount > 0 && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-600 font-semibold px-1.5 py-0.5 rounded-full">
                              {selectedCount}
                            </span>
                          )}
                        </span>
                        <span className="text-gray-400 text-xs">{openGroup === label ? "▲" : "▼"}</span>
                      </button>
                      {openGroup === label && (
                        <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50">
                          {examples.map((ex) => (
                            <button
                              key={ex}
                              onClick={() => toggleExample(ex)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                                selectedExamples.includes(ex)
                                  ? "bg-purple-50 border-purple-400 text-purple-700 font-semibold"
                                  : "bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:text-purple-600"
                              }`}
                            >
                              {selectedExamples.includes(ex) ? "✓ " : ""}{ex}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🎯 วัตถุประสงค์</h2>
              <p className="text-xs text-gray-400 mt-1">ไอเดียนี้จะช่วย VT Markets ในด้านไหน? เลือกได้หลายข้อ</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map(({ key, icon, sub }) => {
                const active = objectives.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleObj(key)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${
                      active
                        ? "bg-purple-50 border-purple-400"
                        : "bg-white border-gray-200 hover:border-purple-200"
                    }`}
                  >
                    <span className="text-lg leading-none mt-0.5 shrink-0">{icon}</span>
                    <div>
                      <p className={`text-xs font-semibold leading-snug ${active ? "text-purple-700" : "text-gray-700"}`}>{key}</p>
                      <p className={`text-xs mt-0.5 leading-snug ${active ? "text-purple-500" : "text-gray-400"}`}>{sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* recap */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">ไอเดียของคุณ:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{ideaValue}</p>
              {categories.length > 0 && <p className="text-xs text-purple-500 mt-1">📌 {categories.join(" · ")}</p>}
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🏢 แผนกที่ต้อง support</h2>
              <p className="text-xs text-gray-400 mt-1">ไอเดียนี้ต้องการแผนกไหนมาช่วย? เลือกได้หลายแผนก</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(["Sales", "MKT", "CS", "Admin", "HR"] as const).map((dept) => (
                <button
                  key={dept}
                  onClick={() => toggleDept(dept)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    departments.includes(dept)
                      ? "bg-purple-50 border-purple-400 text-purple-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-purple-200"
                  }`}
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
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-purple-300 outline-none transition"
                placeholder="ชื่อ PM..."
                value={pm}
                onChange={(e) => setPm(e.target.value)}
              />
            </div>

            {/* recap */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
              <p className="text-xs text-gray-400">สรุปก่อนส่ง:</p>
              {categories.length > 0 && <p className="text-xs text-purple-500">📌 {categories.join(" · ")}</p>}
              <p className="text-sm text-gray-700 leading-relaxed">{ideaValue}</p>
              {objectives.length > 0 && (
                <p className="text-xs text-indigo-500">🎯 {objectives.join(" · ")}</p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-sm px-1">⚠️ {error}</p>}

        {/* Nav buttons */}
        <div className="flex gap-3 pb-6">
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
              {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "✅ ส่งไอเดีย"}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}
