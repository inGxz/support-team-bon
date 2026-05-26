"use client";

import { useState, useEffect } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQc-fubbnh57WsugTUeXRnp9afLXDAF8HdXXa34pyM6DMpvZOaOJJljPowuH6POdcs/exec";

const STEPS = ["Platform", "Goal", "Mood", "Music", "Voice"];

// ================= GRADIENT TEXT =================
function GradText({ gradient, children, className = "" }: { gradient: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={className}
      style={{
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

// ================= PREVIEW MODAL =================
function PreviewModal({ data, onConfirm, onCancel }: { data: Record<string, string>; onConfirm: () => void; onCancel: () => void }) {
  const rows = Object.entries(data).filter(([, v]) => v && v !== "-");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 px-6 py-4">
          <h2 className="text-white text-xl font-bold">📋 ตรวจสอบข้อมูลก่อนส่งงาน</h2>
          <p className="text-purple-100 text-sm mt-0.5">กรุณาตรวจสอบให้ครบถ้วนก่อนกดยืนยัน</p>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {rows.map(([key, value]) => (
            <div key={key} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <span className="text-gray-400 text-sm min-w-[120px] font-medium">{key}</span>
              <span className="text-gray-800 text-sm font-semibold break-all">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 flex gap-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition">
            ✏️ แก้ไข
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition">
            🚀 ยืนยันส่งงาน
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= JOB ID MODAL =================
function JobIdModal({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 h-2" />
        <div className="px-8 py-8 space-y-4">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">ส่งงานสำเร็จแล้ว!</h2>
            <p className="text-gray-400 text-sm mt-1">กรุณาจด Job ID ไว้สำหรับติดตามงาน</p>
          </div>
          {/* Job ID box + copy */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-6 py-4">
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-1">Job ID</p>
            <p className="text-2xl font-bold text-purple-600 tracking-wider mb-3">{jobId}</p>
            <button
              onClick={handleCopy}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
                copied
                  ? "bg-green-100 text-green-600 border border-green-300"
                  : "bg-white text-purple-600 border border-purple-300 hover:bg-purple-100"
              }`}
            >
              {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอก Job ID"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= MAIN PAGE =================
export default function Page() {
  const [customerName, setCustomerName] = useState("");
  const [agent, setAgent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [detail, setDetail] = useState("");
  const [taskType, setTaskType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // VIDEO
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState("");
  const [goal, setGoal] = useState("");
  const [mood, setMood] = useState("");
  const [music, setMusic] = useState("");
  const [voice, setVoice] = useState("");
  const [stepError, setStepError] = useState("");

  // DESIGN / ADS
  const [designType, setDesignType] = useState("");
  const [adsType, setAdsType] = useState("");

  // TRACK
  const [trackingId, setTrackingId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [tracking, setTracking] = useState(false);
  const [recentJobs, setRecentJobs] = useState<string[]>([]);

  // PREVIEW / MODAL
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ task: string; extra: string } | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [jobIdModal, setJobIdModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load recent jobs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentJobs");
      if (stored) setRecentJobs(JSON.parse(stored));
    } catch {}
  }, []);

  const saveRecentJob = (jobId: string) => {
    try {
      const updated = [jobId, ...recentJobs.filter((j) => j !== jobId)].slice(0, 5);
      setRecentJobs(updated);
      localStorage.setItem("recentJobs", JSON.stringify(updated));
    } catch {}
  };

  // STYLE
  const card = "bg-white border border-gray-100 rounded-2xl shadow-sm p-6";
  const input = (hasError?: boolean) =>
    `w-full p-3 rounded-xl border ${hasError ? "border-red-400 ring-2 ring-red-200" : "border-gray-200"} text-gray-900 focus:ring-2 focus:ring-purple-300 outline-none transition`;
  const button =
    "w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition flex items-center justify-center gap-2";
  const backBtn =
    "w-full p-3 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 15000);
  };

  const resetAll = () => {
    setTaskType(""); setStep(0); setPlatform(""); setGoal(""); setMood("");
    setMusic(""); setVoice(""); setDesignType(""); setAdsType("");
    setDeadline(""); setDetail(""); setErrors({});
  };

  // ================= FORM VALIDATION =================
  const validateBase = () => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = "กรุณากรอกชื่อลูกค้า";
    if (!agent.trim()) e.agent = "กรุณากรอกชื่อเซลล์";
    if (!deadline) e.deadline = "กรุณาเลือก Deadline";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ================= VIDEO STEP VALIDATION =================
  const stepValues: Record<number, string> = { 0: platform, 1: goal, 2: mood, 3: music, 4: voice };
  const stepLabels: Record<number, string> = { 0: "Platform", 1: "Goal", 2: "Mood", 3: "Music", 4: "Voice" };

  const handleNextStep = (nextStep: number) => {
    const val = stepValues[step];
    if (!val || val === stepLabels[step]) {
      setStepError(`กรุณาเลือก ${stepLabels[step]} ก่อน`);
      return;
    }
    setStepError("");
    setStep(nextStep);
  };

  // ================= OPEN PREVIEW =================
  const openPreview = (task: string, extra: string) => {
    if (!validateBase()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const base: Record<string, string> = {
      "👤 ลูกค้า": customerName,
      "🧑‍💼 เซลล์": agent,
      "📦 ประเภทงาน": task,
      "📅 Deadline": deadline,
      "📝 รายละเอียด": detail || "-",
    };
    const extraParts = extra.split("|").map((s) => s.trim()).filter(Boolean);
    extraParts.forEach((part) => {
      const [key, ...rest] = part.split(":");
      if (key && rest.length) {
        const icons: Record<string, string> = {
          Platform: "📱 Platform", Goal: "🎯 Goal", Mood: "🎭 Mood",
          Music: "🎵 Music", Voice: "🎙️ Voice",
          Type: "🖼️ ประเภท Design", AdsType: "📢 ประเภท Ads", Detail: "📝 Detail",
        };
        const label = icons[key.trim()] ?? key.trim();
        const value = rest.join(":").trim();
        if (value && value !== "-") base[label] = value;
      }
    });
    setPreviewData(base);
    setPendingTask({ task, extra });
    setShowPreview(true);
  };

  // ================= SUBMIT =================
  const submitTask = async (task: string, extra: string) => {
    setLoading(true);
    showToast("⏳ กำลังส่งงาน...");
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ type: "create", customerName, agent, taskType, task, detail: `${extra} | ${detail} | Deadline: ${deadline}`, deadline }),
    });
    const data = await res.json();
    setLoading(false);
    saveRecentJob(data.jobId);
    setJobIdModal(data.jobId);
    resetAll();
  };

  const handleConfirm = () => {
    setShowPreview(false);
    if (pendingTask) { submitTask(pendingTask.task, pendingTask.extra); setPendingTask(null); }
  };

  // ================= TRACK =================
  const trackJob = async () => {
    if (!trackingId) return;
    setTracking(true);
    setTrackResult(null);
    const res = await fetch(`${SCRIPT_URL}?jobId=${trackingId}`);
    const data = await res.json();
    setTrackResult(data);
    setTracking(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-gray-900">

      {showPreview && <PreviewModal data={previewData} onConfirm={handleConfirm} onCancel={() => setShowPreview(false)} />}

      {jobIdModal && <JobIdModal jobId={jobIdModal} onClose={() => setJobIdModal(null)} />}

      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="animate-spin">⏳</span>
            <p className="font-semibold">กำลังส่งงาน... กรุณารอสถานะ Job ID</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-2xl shadow-md">{toast}</div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700" />
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-purple-400/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-indigo-400/30 rounded-full blur-2xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="relative px-8 py-8 flex flex-col items-center text-center">
            <span className="text-4xl mb-2">🚀</span>
            <h1 className="text-2xl font-black tracking-widest uppercase" style={{ background: "linear-gradient(90deg,#fff 0%,#e0d7ff 40%,#fff 70%,#c4b5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              SUPPORT TEAMBON
            </h1>
            <h2 className="text-lg font-bold tracking-[0.3em] uppercase mt-1" style={{ background: "linear-gradient(90deg,#c4b5fd 0%,#fff 50%,#a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              VT MARKETS
            </h2>
            <div className="mt-4 flex items-center gap-3 w-full justify-center">
              <div className="h-px w-10 bg-purple-300/50" />
              <p className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ background: "linear-gradient(90deg,#b8860b 0%,#ffd700 30%,#fffacd 55%,#ffd700 75%,#b8860b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Premium Workflow System
              </p>
              <div className="h-px w-10 bg-purple-300/50" />
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className={card + " space-y-3"}>
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              👤 ลูกค้า <span className="text-xs text-gray-400">(กรุณาใส่ชื่อ)</span>
            </label>
            <input className={input(!!errors.customerName)} placeholder="Customer Name" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: "" })); }} />
            {errors.customerName && <p className="text-red-400 text-xs mt-1">⚠️ {errors.customerName}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              🧑‍💼 เซลล์ <span className="text-xs text-gray-400">(ผู้ดูแล)</span>
            </label>
            <input className={input(!!errors.agent)} placeholder="Agent Name" value={agent} onChange={(e) => { setAgent(e.target.value); setErrors((p) => ({ ...p, agent: "" })); }} />
            {errors.agent && <p className="text-red-400 text-xs mt-1">⚠️ {errors.agent}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              📅 Deadline <span className="text-xs text-gray-400">(วันครบกำหนดส่งงาน)</span>
            </label>
            <input type="date" className={input(!!errors.deadline)} value={deadline} onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }} />
            {errors.deadline ? <p className="text-red-400 text-xs mt-1">⚠️ {errors.deadline}</p> : <p className="text-xs text-gray-400 mt-1">⚠️ กรุณาเลือกวันที่ต้องการให้ส่งงานเสร็จ</p>}
          </div>

          <textarea className={input() + " h-24"} placeholder="Detail / กรุณากรอกรายละเอียดที่ต้องการ...หรือแนบ Link" value={detail} onChange={(e) => setDetail(e.target.value)} />
        </div>

        {/* TASK TYPE */}
        {!taskType && (
          <div className={card + " space-y-3"}>
            <h2 className="text-xl font-bold">
              <GradText gradient="linear-gradient(90deg,#7c3aed 0%,#6366f1 50%,#8b5cf6 100%)">✦ Select Workflow</GradText>
            </h2>
            <button className={button} onClick={() => setTaskType("Video")}>🎬 Video Workflow</button>
            <button className={button} onClick={() => setTaskType("Design")}>🎨 Design Workflow</button>
            <button className={button} onClick={() => setTaskType("Ads")}>📢 Ads Workflow</button>
          </div>
        )}

        {/* VIDEO */}
        {taskType === "Video" && (
          <div className={card + " space-y-4"}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                <GradText gradient="linear-gradient(90deg,#a855f7 0%,#ec4899 60%,#f472b6 100%)">🎬 Video Workflow</GradText>
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Step {step + 1} / 5</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / 5) * 100}%` }}
              />
            </div>

            {step === 0 && (
              <>
                <select className={input()} value={platform} onChange={(e) => { setPlatform(e.target.value); setStepError(""); }}>
                  <option value="Platform">เลือก Platform</option>
                  <option>TikTok</option><option>Facebook Reels</option><option>YouTube Shorts</option><option>YouTube Long</option>
                </select>
                {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
                <button className={button} onClick={() => handleNextStep(1)}>Next →</button>
                <button className={backBtn} onClick={() => { setTaskType(""); setStep(0); setStepError(""); }}>← กลับเลือก Workflow</button>
              </>
            )}

            {step === 1 && (
              <>
                <select className={input()} value={goal} onChange={(e) => { setGoal(e.target.value); setStepError(""); }}>
                  <option value="Goal">เลือก Goal</option>
                  <option>Branding</option><option>Client Story</option><option>Motivation</option><option>Event Promotion</option><option>Lead Generation</option><option>Education</option><option>Lifestyle&Vlog</option>
                </select>
                {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
                <button className={button} onClick={() => handleNextStep(2)}>Next →</button>
                <button className={backBtn} onClick={() => { setStep(0); setStepError(""); }}>← กลับ</button>
              </>
            )}

            {step === 2 && (
              <>
                <select className={input()} value={mood} onChange={(e) => { setMood(e.target.value); setStepError(""); }}>
                  <option value="Mood">เลือก Mood</option>
                  <option>Cinematic</option><option>Luxury</option><option>Vlog</option><option>Fast Cut</option><option>Documentary</option><option>Inspirational</option><option>Professional</option><option>Casual</option>
                </select>
                {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
                <button className={button} onClick={() => handleNextStep(3)}>Next →</button>
                <button className={backBtn} onClick={() => { setStep(1); setStepError(""); }}>← กลับ</button>
              </>
            )}

            {step === 3 && (
              <>
                <select className={input()} value={music} onChange={(e) => { setMusic(e.target.value); setStepError(""); }}>
                  <option value="Music">เลือก Music</option>
                  <option>Epic</option><option>Lo-fi</option><option>Motivational</option><option>Cinematic</option><option>ไม่มีเพลง</option><option>แล้วแต่ตัดต่อ</option>
                </select>
                {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
                <button className={button} onClick={() => handleNextStep(4)}>Next →</button>
                <button className={backBtn} onClick={() => { setStep(2); setStepError(""); }}>← กลับ</button>
              </>
            )}

            {step === 4 && (
              <>
                <select className={input()} value={voice} onChange={(e) => { setVoice(e.target.value); setStepError(""); }}>
                  <option value="Voice">เลือก Voice</option>
                  <option>AI Voice</option><option>Real Voice</option><option>ไม่มี</option><option>พากย์เสียงใหม่</option>
                </select>
                {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
                <button className={button} onClick={() => openPreview("Video", `Platform:${platform} | Goal:${goal} | Mood:${mood} | Music:${music} | Voice:${voice}`)}>
                  📋 ตรวจสอบก่อนส่งงาน
                </button>
                <button className={backBtn} onClick={() => { setStep(3); setStepError(""); }}>← กลับ</button>
              </>
            )}
          </div>
        )}

        {/* DESIGN */}
        {taskType === "Design" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-bold">
              <GradText gradient="linear-gradient(90deg,#06b6d4 0%,#3b82f6 60%,#6366f1 100%)">🎨 Design Workflow</GradText>
            </h2>
            <select className={input()} value={designType} onChange={(e) => setDesignType(e.target.value)}>
              <option value="">เลือกประเภท Design</option>
              <option>Logo</option><option>Poster</option><option>Banner</option><option>Infographic</option><option>PDF</option><option>Profile</option>
            </select>
            <button className={button} onClick={() => openPreview("Design", `Type:${designType || "-"} | Detail:${detail || "-"}`)}>📋 ตรวจสอบก่อนส่งงาน</button>
            <button className={backBtn} onClick={() => setTaskType("")}>← กลับเลือก Workflow</button>
          </div>
        )}

        {/* ADS */}
        {taskType === "Ads" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-bold">
              <GradText gradient="linear-gradient(90deg,#f97316 0%,#ef4444 60%,#f43f5e 100%)">📢 Ads Workflow</GradText>
            </h2>
            <select className={input()} value={adsType} onChange={(e) => setAdsType(e.target.value)}>
              <option value="">เลือกประเภท Ads</option>
              <option>Facebook Ads</option><option>Google Ads</option><option>TikTok Ads</option>
            </select>
            <button className={button} onClick={() => openPreview("Ads", `AdsType:${adsType || "-"} | Detail:${detail || "-"}`)}>📋 ตรวจสอบก่อนส่งงาน</button>
            <button className={backBtn} onClick={() => setTaskType("")}>← กลับเลือก Workflow</button>
          </div>
        )}

        {/* TRACK */}
        <div className={card + " space-y-4"}>
          <h2 className="text-xl font-bold">
            <GradText gradient="linear-gradient(90deg,#10b981 0%,#06b6d4 60%,#3b82f6 100%)">🔍 Track Job ID</GradText>
          </h2>

          <div className="flex gap-2">
            <input
              className={input()}
              placeholder="กรอก Job ID ที่ได้รับ"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && trackJob()}
            />
            <button
              className={`px-5 py-2 rounded-xl font-semibold text-white transition min-w-[110px] flex items-center justify-center gap-2 ${tracking ? "bg-indigo-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 hover:scale-[1.02]"}`}
              onClick={trackJob} disabled={tracking}
            >
              {tracking ? <><span className="animate-spin">⏳</span><span>ค้นหา...</span></> : <>🔍 Search</>}
            </button>
          </div>

          {/* Recent Jobs */}
          {recentJobs.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">🕐 Job ล่าสุด</p>
              <div className="flex flex-wrap gap-2">
                {recentJobs.map((j) => (
                  <button
                    key={j}
                    onClick={() => { setTrackingId(j); }}
                    className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded-lg hover:bg-purple-100 transition font-medium"
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Skeleton */}
          {tracking && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          )}

          {/* Result */}
          {!tracking && trackResult && (
            <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className={`px-5 py-3 flex items-center gap-2 text-white font-semibold text-sm ${
                trackResult.status === "Done" || trackResult.status === "เสร็จแล้ว" ? "bg-green-500"
                : trackResult.status === "In Progress" || trackResult.status === "กำลังทำ" ? "bg-blue-500"
                : "bg-amber-400"
              }`}>
                <span>{trackResult.status === "Done" || trackResult.status === "เสร็จแล้ว" ? "✅" : trackResult.status === "In Progress" || trackResult.status === "กำลังทำ" ? "🔄" : "⏳"}</span>
                <span>สถานะ: {trackResult.status}</span>
              </div>
              <div className="bg-white divide-y divide-gray-50">
                {[
                  { label: "📦 ประเภทงาน", value: trackResult.task },
                  { label: "📝 รายละเอียด", value: trackResult.detail },
                  { label: "👤 ลูกค้า", value: trackResult.customerName },
                  { label: "🧑‍💼 เซลล์", value: trackResult.agent },
                  { label: "📅 Deadline", value: trackResult.deadline },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex gap-3 px-5 py-3">
                    <span className="text-gray-400 text-sm min-w-[130px]">{r.label}</span>
                    <span className="text-gray-800 text-sm font-medium break-all">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
