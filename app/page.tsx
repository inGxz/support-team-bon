"use client";

import { useState, useEffect } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQc-fubbnh57WsugTUeXRnp9afLXDAF8HdXXa34pyM6DMpvZOaOJJljPowuH6POdcs/exec";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "2010203041-YMuS2DBp";

const TODAY = new Date().toISOString().split("T")[0];

// ================= LIFF TYPES =================
declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (config?: { redirectUri?: string }) => void;
      logout: () => void;
      getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl: string; statusMessage?: string }>;
      isInClient: () => boolean;
      ready: Promise<void>;
    };
  }
}

// ================= SOUND =================
function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.6);
  } catch {}
}

// ================= GRADIENT TEXT =================
function GradText({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <span style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

// ================= CONFIRM MODAL =================
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="px-8 py-8 space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-gray-700 font-semibold">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">ยกเลิก</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition">ยืนยัน</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= ERROR MODAL =================
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="bg-red-500 h-2" />
        <div className="px-8 py-8 space-y-4">
          <div className="text-4xl">❌</div>
          <h2 className="text-lg font-bold text-gray-800">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-500 text-sm">{message}</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition">ลองใหม่อีกครั้ง</button>
        </div>
      </div>
    </div>
  );
}

// ================= PREVIEW MODAL =================
function PreviewModal({ data, onConfirm, onCancel, submitting }: { data: Record<string, string>; onConfirm: () => void; onCancel: () => void; submitting: boolean }) {
  const rows = Object.entries(data).filter(([, v]) => v && v !== "-");
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 px-6 py-4">
          <h2 className="text-white text-xl font-bold">📋 ตรวจสอบข้อมูลก่อนส่งงาน</h2>
          <p className="text-purple-100 text-sm mt-0.5">กรุณาตรวจสอบให้ครบถ้วนก่อนกดยืนยัน</p>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[55vh] overflow-y-auto">
          {rows.map(([key, value]) => (
            <div key={key} className="flex gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <span className="text-gray-400 text-sm min-w-[120px] font-medium">{key}</span>
              <span className="text-gray-800 text-sm font-semibold break-all">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 flex gap-3 bg-gray-50 border-t border-gray-100">
          <button onClick={onCancel} disabled={submitting} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition disabled:opacity-50">✏️ แก้ไข</button>
          <button onClick={onConfirm} disabled={submitting} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <><span className="animate-spin">⏳</span> กำลังส่ง...</> : "🚀 ยืนยันส่งงาน"}
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

  const handleShareLine = () => {
    const msg = encodeURIComponent(`🚀 Job ID ของคุณคือ: ${jobId}\nติดตามสถานะงานได้ที่ระบบ TEAMBON VT MARKET`);
    window.open(`https://line.me/R/msg/text/?${msg}`, "_blank");
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
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl px-6 py-4">
            <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-1">Job ID</p>
            <p className="text-2xl font-bold text-purple-600 tracking-wider mb-3">{jobId}</p>
            <button onClick={handleCopy} className={`w-full py-2 rounded-lg text-sm font-semibold transition ${copied ? "bg-green-100 text-green-600 border border-green-300" : "bg-white text-purple-600 border border-purple-300 hover:bg-purple-100"}`}>
              {copied ? "✅ คัดลอกแล้ว!" : "📋 คัดลอก Job ID"}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShareLine}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2"
              style={{ backgroundColor: "#06C755" }}
            >
              <span>💬</span> แชร์ Line
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              🔗 Copy Link
            </button>
          </div>

          <button onClick={onClose} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition">
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= JOB HISTORY PANEL =================
type JobRecord = { jobId: string; task: string; customerName: string; deadline: string; submittedAt: string };

function JobHistoryPanel({ jobs, dark, onClose, onTrack }: { jobs: JobRecord[]; dark: boolean; onClose: () => void; onTrack: (id: string) => void }) {
  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100";
  const textMain = dark ? "text-white" : "text-gray-800";
  const textSub = dark ? "text-gray-400" : "text-gray-500";
  const bg = dark ? "bg-gray-900" : "bg-gray-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${dark ? "bg-gray-800" : "bg-white"}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-lg font-bold">📋 ประวัติงานที่ส่ง</h2>
            <p className="text-purple-100 text-xs mt-0.5">{jobs.length} รายการล่าสุด</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none transition">✕</button>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {jobs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">ยังไม่มีประวัติงานครับ</div>
          ) : (
            jobs.map((j) => {
              const daysLeft = Math.ceil((new Date(j.deadline).getTime() - Date.now()) / 86400000);
              const urgent = daysLeft >= 0 && daysLeft <= 2;
              return (
                <div key={j.jobId} className={`px-5 py-4 flex items-start justify-between gap-3 ${dark ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-purple-600 text-sm">{j.jobId}</span>
                      {urgent && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">🔥 ด่วน</span>}
                    </div>
                    <p className={`text-sm font-medium mt-0.5 truncate ${textMain}`}>{j.customerName} — {j.task}</p>
                    <p className={`text-xs mt-0.5 ${textSub}`}>
                      📅 {j.deadline}
                      {daysLeft >= 0 ? ` (อีก ${daysLeft} วัน)` : " (เกินกำหนด)"}
                    </p>
                    <p className={`text-xs ${textSub}`}>🕐 ส่งเมื่อ {j.submittedAt}</p>
                  </div>
                  <button
                    onClick={() => { onTrack(j.jobId); onClose(); }}
                    className="shrink-0 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded-lg hover:bg-purple-100 transition font-semibold"
                  >
                    Track
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ================= STEP SUMMARY =================
function StepSummary({ items }: { items: { label: string; value: string }[] }) {
  const filled = items.filter((i) => i.value && i.value !== i.label);
  if (!filled.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pb-1">
      {filled.map((i) => (
        <span key={i.label} className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-full font-medium">
          {i.label}: <span className="font-bold">{i.value}</span>
        </span>
      ))}
    </div>
  );
}

// ================= LINE LOADING SCREEN =================
function LiffLoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: "linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)" }}>
      <div className="text-5xl mb-4 animate-bounce">💬</div>
      <p className="text-white font-bold text-lg">กำลังโหลด...</p>
      <p className="text-purple-200 text-sm mt-1">กรุณารอสักครู่</p>
    </div>
  );
}

// ================= LINE LOGIN SCREEN (fullscreen บังคับ) =================
function LineLoginScreen({ onLogin, loading }: { onLogin: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 p-6" style={{ background: "linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)" }}>
      {/* Logo / Header */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🚀</div>
        <h1 className="text-white text-2xl font-black tracking-widest uppercase">SUPPORT TEAMBON</h1>
        <p className="text-purple-200 text-sm tracking-widest uppercase mt-1">VT MARKET</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="h-2" style={{ background: "#06C755" }} />
        <div className="px-8 py-8 space-y-5">
          <div className="text-5xl">💚</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">เข้าสู่ระบบด้วย LINE</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              กรุณา Login ด้วย LINE ของคุณก่อนใช้งาน<br />
              ระบบจะจำ Job ID ของคุณโดยอัตโนมัติ<br />
              และแจ้งสถานะงานผ่าน LINE
            </p>
          </div>
          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-3 disabled:opacity-60 active:scale-95"
            style={{ backgroundColor: "#06C755" }}
          >
            {loading ? (
              <><span className="animate-spin">⏳</span> กำลังเชื่อมต่อ...</>
            ) : (
              <><span className="text-xl">💬</span> Login ด้วย LINE</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================= MAIN PAGE =================
export default function Page() {
  const [dark, setDark] = useState(false);

  // BASE
  const [customerName, setCustomerName] = useState("");
  const [agent, setAgent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [detail, setDetail] = useState("");
  const [refLink, setRefLink] = useState("");
  const [taskType, setTaskType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // CUSTOMER SUGGEST
  const [allCustomers, setAllCustomers] = useState<string[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // VIDEO
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState("Platform");
  const [goal, setGoal] = useState("Goal");
  const [mood, setMood] = useState("Mood");
  const [music, setMusic] = useState("Music");
  const [voice, setVoice] = useState("Voice");
  const [stepError, setStepError] = useState("");

  // DESIGN / ADS
  const [designType, setDesignType] = useState("");
  const [adsType, setAdsType] = useState("");

  // TRACK
  const [trackingId, setTrackingId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [tracking, setTracking] = useState(false);
  const [recentJobs, setRecentJobs] = useState<string[]>([]);

  // JOB HISTORY
  const [jobHistory, setJobHistory] = useState<JobRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // LINE / LIFF
  const [liffReady, setLiffReady] = useState(false);
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string; pictureUrl: string } | null>(null);
  const [liffLoading, setLiffLoading] = useState(false);
  const [showLineLogin, setShowLineLogin] = useState(false);

  // MODALS
  const [showPreview, setShowPreview] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ task: string; extra: string } | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [jobIdModal, setJobIdModal] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [confirmBack, setConfirmBack] = useState<(() => void) | null>(null);

  // LIFF initialization — poll until window.liff is ready
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 30; // รอสูงสุด 15 วินาที (30 × 500ms)

    const tryInit = async () => {
      if (cancelled) return;
      if (typeof window === "undefined") return;

      // รอ LIFF SDK โหลดเสร็จก่อน
      if (!window.liff) {
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryInit, 500);
        } else {
          // โหลดไม่สำเร็จ — เปิดให้ใช้งานปกติได้แต่ไม่มี LINE login
          if (!cancelled) setLiffReady(true);
        }
        return;
      }

      setLiffLoading(true);
      try {
        await window.liff.init({ liffId: LIFF_ID });
        if (cancelled) return;
        setLiffReady(true);
        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          if (cancelled) return;
          setLineProfile(profile);
          setCustomerName((prev) => prev || profile.displayName);
        } else {
          setShowLineLogin(true);
        }
      } catch (err) {
        console.error("LIFF init error:", err);
        if (!cancelled) setLiffReady(true);
      } finally {
        if (!cancelled) setLiffLoading(false);
      }
    };

    setTimeout(tryInit, 500);
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const jobs = localStorage.getItem("recentJobs");
      if (jobs) setRecentJobs(JSON.parse(jobs));
      const customers = localStorage.getItem("allCustomers");
      if (customers) setAllCustomers(JSON.parse(customers));
      const history = localStorage.getItem("jobHistory");
      if (history) setJobHistory(JSON.parse(history));
      const savedDark = localStorage.getItem("darkMode");
      if (savedDark) setDark(JSON.parse(savedDark));
    } catch {}
  }, []);

  const handleLineLogin = () => {
    try {
      if (window.liff && !window.liff.isLoggedIn()) {
        window.liff.login();
      }
    } catch (err) {
      console.error("LINE login error:", err);
    }
  };

  const handleLineLogout = () => {
    try {
      if (window.liff) {
        window.liff.logout();
        setLineProfile(null);
        setShowLineLogin(true);
      }
    } catch (err) {
      console.error("LINE logout error:", err);
    }
  };

  const saveRecentJob = (jobId: string) => {
    try {
      const updated = [jobId, ...recentJobs.filter((j) => j !== jobId)].slice(0, 5);
      setRecentJobs(updated);
      localStorage.setItem("recentJobs", JSON.stringify(updated));
    } catch {}
  };

  const saveJobHistory = (jobId: string, task: string) => {
    try {
      const record: JobRecord = {
        jobId,
        task,
        customerName,
        deadline,
        submittedAt: new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }),
      };
      const updated = [record, ...jobHistory].slice(0, 50);
      setJobHistory(updated);
      localStorage.setItem("jobHistory", JSON.stringify(updated));
    } catch {}
  };

  const saveCustomer = (name: string) => {
    try {
      const updated = [name, ...allCustomers.filter((c) => c !== name)].slice(0, 20);
      setAllCustomers(updated);
      localStorage.setItem("allCustomers", JSON.stringify(updated));
    } catch {}
  };

  const toggleDark = () => {
    setDark((d) => { localStorage.setItem("darkMode", JSON.stringify(!d)); return !d; });
  };

  // STYLES
  const bg = dark ? "bg-gray-900" : "bg-gray-100";
  const card = dark ? "bg-gray-800 border border-gray-700 rounded-2xl shadow-sm p-6" : "bg-white border border-gray-100 rounded-2xl shadow-sm p-6";
  const inputCls = (hasError?: boolean) =>
    `w-full p-3 rounded-xl border ${hasError ? "border-red-400 ring-2 ring-red-200" : dark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-200 text-gray-900"} focus:ring-2 focus:ring-purple-300 outline-none transition`;
  const labelCls = dark ? "text-sm font-semibold text-gray-300 flex items-center gap-2" : "text-sm font-semibold text-gray-700 flex items-center gap-2";
  const btnPrimary = "w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100";
  const btnBack = `w-full p-3 rounded-xl border-2 ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"} font-semibold transition flex items-center justify-center gap-2`;

  // VALIDATION
  const validateBase = () => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = "กรุณากรอกชื่อลูกค้า";
    if (!agent.trim()) e.agent = "กรุณากรอกชื่อเซลล์";
    if (!deadline) e.deadline = "กรุณาเลือก Deadline";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const stepValues: Record<number, string> = { 0: platform, 1: goal, 2: mood, 3: music, 4: voice };
  const stepDefaults: Record<number, string> = { 0: "Platform", 1: "Goal", 2: "Mood", 3: "Music", 4: "Voice" };

  const handleNextStep = (next: number) => {
    if (!stepValues[step] || stepValues[step] === stepDefaults[step]) {
      setStepError(`กรุณาเลือก ${stepDefaults[step]} ก่อน`);
      return;
    }
    setStepError("");
    setStep(next);
  };

  const handleBackWithConfirm = (action: () => void, hasProgress: boolean) => {
    if (hasProgress) setConfirmBack(() => action);
    else action();
  };

  // OPEN PREVIEW
  const openPreview = (task: string, extra: string) => {
    if (!validateBase()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const base: Record<string, string> = {
      "👤 ลูกค้า": customerName,
      "🧑‍💼 เซลล์": agent,
      "📦 ประเภทงาน": task,
      "📅 Deadline": deadline,
      "📝 รายละเอียด": detail || "-",
      "🔗 ลิ้งอ้างอิง": refLink || "-",
    };
    extra.split("|").map((s) => s.trim()).filter(Boolean).forEach((part) => {
      const [key, ...rest] = part.split(":");
      if (key && rest.length) {
        const icons: Record<string, string> = { Platform: "📱 Platform", Goal: "🎯 Goal", Mood: "🎭 Mood", Music: "🎵 Music", Voice: "🎙️ Voice", Type: "🖼️ ประเภท Design", AdsType: "📢 ประเภท Ads" };
        const label = icons[key.trim()] ?? key.trim();
        const value = rest.join(":").trim();
        if (value && value !== "-") base[label] = value;
      }
    });
    setPreviewData(base);
    setPendingTask({ task, extra });
    setShowPreview(true);
  };

  // SUBMIT
  const submitTask = async (task: string, extra: string) => {
    setSubmitting(true);
    try {
      const lineUserId = lineProfile?.userId || null;
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          type: "create",
          customerName,
          agent,
          taskType,
          task,
          detail: `${extra} | ${detail} | Deadline: ${deadline}`,
          reference: refLink,
          deadline,
          lineUserId,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      playDing();
      saveRecentJob(data.jobId);
      saveJobHistory(data.jobId, task);
      saveCustomer(customerName);
      setJobIdModal(data.jobId);

      // Send LINE push notification if user is logged in
      if (lineUserId) {
        try {
          await fetch("/api/line/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: lineUserId,
              jobId: data.jobId,
              type: "created",
              customerName,
              taskLabel: task,
            }),
          });
        } catch {
          // Push failure is non-critical — don't block the flow
          console.warn("LINE push failed");
        }
      }

      resetAll();
    } catch {
      setErrorModal("ไม่สามารถส่งงานได้ กรุณาตรวจสอบการเชื่อมต่ออินเตอร์เน็ตแล้วลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
      setShowPreview(false);
      setPendingTask(null);
    }
  };

  const handleConfirm = () => { if (pendingTask) submitTask(pendingTask.task, pendingTask.extra); };

  const resetAll = () => {
    setTaskType(""); setStep(0);
    setPlatform("Platform"); setGoal("Goal"); setMood("Mood"); setMusic("Music"); setVoice("Voice");
    setDesignType(""); setAdsType(""); setDeadline(""); setDetail(""); setRefLink(""); setErrors({});
  };

  // TRACK
  const trackJob = async (id?: string) => {
    const searchId = id || trackingId;
    if (!searchId) return;
    if (id) setTrackingId(id);
    setTracking(true);
    setTrackResult(null);
    try {
      const lineUserId = lineProfile?.userId || "";
      const url = lineUserId
        ? `${SCRIPT_URL}?jobId=${searchId}&lineUserId=${encodeURIComponent(lineUserId)}`
        : `${SCRIPT_URL}?jobId=${searchId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // If backend returns an access-denied flag, show error
      if (data.error === "FORBIDDEN") {
        setTrackResult(null);
        setErrorModal("❌ คุณไม่มีสิทธิ์ดูงานนี้ กรุณา Login ด้วย LINE ที่สั่งงาน");
        return;
      }
      setTrackResult(data);
    } catch {
      setErrorModal("ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setTracking(false);
    }
  };

  // CUSTOMER SUGGEST
  const handleCustomerInput = (val: string) => {
    setCustomerName(val);
    setErrors((p) => ({ ...p, customerName: "" }));
    if (val.length > 0) {
      const filtered = allCustomers.filter((c) => c.toLowerCase().includes(val.toLowerCase()));
      setCustomerSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // บังคับ login — แสดงหน้า loading / login ก่อนถ้ายังไม่ได้ login
  if (!liffReady) return <LiffLoadingScreen />;
  if (!lineProfile) return <LineLoginScreen onLogin={handleLineLogin} loading={liffLoading} />;

  return (
    <main className={`min-h-screen ${bg} p-4 transition-colors duration-300`}>

      {showPreview && <PreviewModal data={previewData} onConfirm={handleConfirm} onCancel={() => !submitting && setShowPreview(false)} submitting={submitting} />}
      {jobIdModal && <JobIdModal jobId={jobIdModal} onClose={() => setJobIdModal(null)} />}
      {errorModal && <ErrorModal message={errorModal} onClose={() => setErrorModal(null)} />}
      {confirmBack && <ConfirmModal message="ข้อมูลที่กรอกไปจะหายทั้งหมด ต้องการกลับจริงไหม?" onConfirm={() => { confirmBack(); setConfirmBack(null); }} onCancel={() => setConfirmBack(null)} />}
      {showHistory && <JobHistoryPanel jobs={jobHistory} dark={dark} onClose={() => setShowHistory(false)} onTrack={(id) => { setTrackingId(id); trackJob(id); }} />}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="relative">
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
                VT MARKET
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

          {/* Buttons — outside overflow-hidden */}
          <div className="absolute top-4 right-4 flex gap-2 z-10 items-center">
            <button
              onClick={toggleDark}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition backdrop-blur-sm"
            >
              {dark ? "☀️" : "🌙"}
            </button>
            {/* LINE profile pill */}
            {lineProfile ? (
              <button
                onClick={handleLineLogout}
                title="Logout จาก LINE"
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition backdrop-blur-sm max-w-[140px]"
              >
                {lineProfile.pictureUrl && (
                  <img src={lineProfile.pictureUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                )}
                <span className="truncate">{lineProfile.displayName}</span>
                <span className="opacity-60 text-[10px] shrink-0">✕</span>
              </button>
            ) : liffReady ? (
              <button
                onClick={() => setShowLineLogin(true)}
                className="flex items-center gap-1.5 bg-[#06C755]/80 hover:bg-[#06C755] text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition backdrop-blur-sm"
              >
                💬 LINE Login
              </button>
            ) : null}
          </div>
        </div>

        {/* CUSTOMER */}
        <div className={card + " space-y-4"}>
          <div className="relative">
            <label className={labelCls}>
              👤 ลูกค้า
              {lineProfile
                ? <span className="text-xs text-green-500 font-normal">✅ ล็อคจาก LINE</span>
                : <span className="text-xs text-gray-400">(กรุณาใส่ชื่อ)</span>
              }
            </label>
            <div className="relative">
              <input
                className={inputCls(!!errors.customerName) + (lineProfile ? (dark ? " bg-gray-700 cursor-not-allowed text-white" : " bg-green-50 cursor-not-allowed text-gray-700") : "")}
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => !lineProfile && handleCustomerInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
                readOnly={!!lineProfile}
              />
              {lineProfile && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-sm">🔒</span>
              )}
            </div>
            {errors.customerName && <p className="text-red-400 text-xs mt-1">⚠️ {errors.customerName}</p>}
            {showSuggestions && (
              <div className={`absolute z-10 w-full mt-1 rounded-xl shadow-lg border overflow-hidden ${dark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                {customerSuggestions.map((c) => (
                  <button key={c} className={`w-full text-left px-4 py-2.5 text-sm ${dark ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-purple-50"} transition`} onClick={() => { setCustomerName(c); setShowSuggestions(false); setErrors((p) => ({ ...p, customerName: "" })); }}>
                    👤 {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>🧑‍💼 เซลล์ <span className="text-xs text-gray-400">(ผู้ดูแล)</span></label>
            <input className={inputCls(!!errors.agent)} placeholder="Agent Name" value={agent} onChange={(e) => { setAgent(e.target.value); setErrors((p) => ({ ...p, agent: "" })); }} />
            {errors.agent && <p className="text-red-400 text-xs mt-1">⚠️ {errors.agent}</p>}
          </div>

          <div>
            <label className={labelCls}>📅 Deadline <span className="text-xs text-gray-400">(วันครบกำหนดส่งงาน)</span></label>
            <input type="date" min={TODAY} className={inputCls(!!errors.deadline)} value={deadline} onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }} />
            {errors.deadline ? <p className="text-red-400 text-xs mt-1">⚠️ {errors.deadline}</p> : <p className="text-xs text-gray-400 mt-1">⚠️ กรุณาเลือกวันที่ต้องการให้ส่งงานเสร็จ</p>}
          </div>

          <textarea className={inputCls() + " h-24 resize-none"} placeholder="Detail / กรุณากรอกรายละเอียดที่ต้องการ..." value={detail} onChange={(e) => setDetail(e.target.value)} />

          <div>
            <label className={labelCls}>🔗 ลิ้งตัวอย่าง / Google Drive <span className="text-xs text-gray-400">(ถ้ามี)</span></label>
            <div className="relative">
              <input className={inputCls() + " pl-10"} placeholder="https://drive.google.com/..." value={refLink} onChange={(e) => setRefLink(e.target.value)} />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔗</span>
            </div>
            {refLink && (
              <a href={refLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-purple-500 hover:text-purple-700 hover:underline transition">
                ↗ เปิดลิ้งในแท็บใหม่
              </a>
            )}
          </div>
        </div>

        {/* TASK TYPE */}
        {!taskType && (
          <div className={card + " space-y-3"}>
            <h2 className="text-xl font-bold"><GradText gradient="linear-gradient(90deg,#7c3aed 0%,#6366f1 50%,#8b5cf6 100%)">✦ Select Workflow</GradText></h2>
            <button className={btnPrimary} onClick={() => setTaskType("Video")}>🎬 Video Workflow</button>
            <button className={btnPrimary} onClick={() => setTaskType("Design")}>🎨 Design Workflow</button>
            <button className={btnPrimary} onClick={() => setTaskType("Ads")}>📢 Ads Workflow</button>
          </div>
        )}

        {/* VIDEO */}
        {taskType === "Video" && (
          <div className={card + " space-y-4"}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold"><GradText gradient="linear-gradient(90deg,#a855f7 0%,#ec4899 60%,#f472b6 100%)">🎬 Video Workflow</GradText></h2>
              <span className={`text-xs ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-400"} px-3 py-1 rounded-full`}>Step {step + 1} / 5</span>
            </div>
            <div className={`w-full ${dark ? "bg-gray-700" : "bg-gray-100"} rounded-full h-2`}>
              <div className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} />
            </div>
            <StepSummary items={[{ label: "Platform", value: platform }, { label: "Goal", value: goal }, { label: "Mood", value: mood }, { label: "Music", value: music }]} />

            {step === 0 && (<>
              <select className={inputCls()} value={platform} onChange={(e) => { setPlatform(e.target.value); setStepError(""); }}>
                <option value="Platform">เลือก Platform</option>
                <option>TikTok</option><option>Facebook Reels</option><option>YouTube Shorts</option><option>YouTube Long</option>
              </select>
              {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
              <button className={btnPrimary} onClick={() => handleNextStep(1)}>Next →</button>
              <button className={btnBack} onClick={() => handleBackWithConfirm(() => { setTaskType(""); setStep(0); setStepError(""); }, false)}>← กลับเลือก Workflow</button>
            </>)}

            {step === 1 && (<>
              <select className={inputCls()} value={goal} onChange={(e) => { setGoal(e.target.value); setStepError(""); }}>
                <option value="Goal">เลือก Goal</option>
                <option>Branding</option><option>Client Story</option><option>Motivation</option><option>Event Promotion</option><option>Lead Generation</option><option>Education</option><option>Lifestyle&Vlog</option>
              </select>
              {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
              <button className={btnPrimary} onClick={() => handleNextStep(2)}>Next →</button>
              <button className={btnBack} onClick={() => { setStep(0); setStepError(""); }}>← กลับ</button>
            </>)}

            {step === 2 && (<>
              <select className={inputCls()} value={mood} onChange={(e) => { setMood(e.target.value); setStepError(""); }}>
                <option value="Mood">เลือก Mood</option>
                <option>Cinematic</option><option>Luxury</option><option>Vlog</option><option>Fast Cut</option><option>Documentary</option><option>Inspirational</option><option>Professional</option><option>Casual</option>
              </select>
              {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
              <button className={btnPrimary} onClick={() => handleNextStep(3)}>Next →</button>
              <button className={btnBack} onClick={() => { setStep(1); setStepError(""); }}>← กลับ</button>
            </>)}

            {step === 3 && (<>
              <select className={inputCls()} value={music} onChange={(e) => { setMusic(e.target.value); setStepError(""); }}>
                <option value="Music">เลือก Music</option>
                <option>Epic</option><option>Lo-fi</option><option>Motivational</option><option>Cinematic</option><option>ไม่มีเพลง</option><option>แล้วแต่ตัดต่อ</option>
              </select>
              {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
              <button className={btnPrimary} onClick={() => handleNextStep(4)}>Next →</button>
              <button className={btnBack} onClick={() => { setStep(2); setStepError(""); }}>← กลับ</button>
            </>)}

            {step === 4 && (<>
              <select className={inputCls()} value={voice} onChange={(e) => { setVoice(e.target.value); setStepError(""); }}>
                <option value="Voice">เลือก Voice</option>
                <option>AI Voice</option><option>Real Voice</option><option>ไม่มี</option><option>พากย์เสียงใหม่</option>
              </select>
              {stepError && <p className="text-red-400 text-xs">⚠️ {stepError}</p>}
              <button className={btnPrimary} onClick={() => openPreview("Video", `Platform:${platform} | Goal:${goal} | Mood:${mood} | Music:${music} | Voice:${voice}`)}>📋 ตรวจสอบก่อนส่งงาน</button>
              <button className={btnBack} onClick={() => { setStep(3); setStepError(""); }}>← กลับ</button>
            </>)}
          </div>
        )}

        {/* DESIGN */}
        {taskType === "Design" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-bold"><GradText gradient="linear-gradient(90deg,#06b6d4 0%,#3b82f6 60%,#6366f1 100%)">🎨 Design Workflow</GradText></h2>
            <select className={inputCls()} value={designType} onChange={(e) => setDesignType(e.target.value)}>
              <option value="">เลือกประเภท Design</option>
              <option>Logo</option><option>Poster</option><option>Banner</option><option>Infographic</option><option>PDF</option><option>Profile</option>
            </select>
            <button className={btnPrimary} onClick={() => openPreview("Design", `Type:${designType || "-"} | Detail:${detail || "-"}`)}>📋 ตรวจสอบก่อนส่งงาน</button>
            <button className={btnBack} onClick={() => handleBackWithConfirm(() => setTaskType(""), !!designType)}>← กลับเลือก Workflow</button>
          </div>
        )}

        {/* ADS */}
        {taskType === "Ads" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-bold"><GradText gradient="linear-gradient(90deg,#f97316 0%,#ef4444 60%,#f43f5e 100%)">📢 Ads Workflow</GradText></h2>
            <select className={inputCls()} value={adsType} onChange={(e) => setAdsType(e.target.value)}>
              <option value="">เลือกประเภท Ads</option>
              <option>Facebook Ads</option><option>Google Ads</option><option>TikTok Ads</option>
            </select>
            <button className={btnPrimary} onClick={() => openPreview("Ads", `AdsType:${adsType || "-"} | Detail:${detail || "-"}`)}>📋 ตรวจสอบก่อนส่งงาน</button>
            <button className={btnBack} onClick={() => handleBackWithConfirm(() => setTaskType(""), !!adsType)}>← กลับเลือก Workflow</button>
          </div>
        )}

        {/* TRACK */}
        <div className={card + " space-y-4"}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold"><GradText gradient="linear-gradient(90deg,#10b981 0%,#06b6d4 60%,#3b82f6 100%)">🔍 Track Job ID</GradText></h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 text-xs font-semibold hover:bg-purple-100 transition"
              >
                📋 ประวัติงาน
                {jobHistory.length > 0 && (
                  <span className="bg-purple-500 text-white rounded-full px-1.5 py-0.5 text-xs leading-none">{jobHistory.length}</span>
                )}
              </button>
              {recentJobs.length > 0 && (
                <button onClick={() => { setRecentJobs([]); try { localStorage.removeItem("recentJobs"); } catch {} }} className="text-xs text-gray-400 hover:text-red-400 transition">ล้างประวัติ ✕</button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input className={inputCls()} placeholder="กรอก Job ID ที่ได้รับ" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && trackJob()} />
            <button className={`px-5 py-2 rounded-xl font-semibold text-white transition min-w-[110px] flex items-center justify-center gap-2 ${tracking ? "bg-indigo-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 hover:scale-[1.02]"}`} onClick={() => trackJob()} disabled={tracking}>
              {tracking ? <><span className="animate-spin">⏳</span><span>ค้นหา...</span></> : <>🔍 Search</>}
            </button>
          </div>

          {recentJobs.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2 font-medium">🕐 Job ล่าสุด</p>
              <div className="flex flex-wrap gap-2">
                {recentJobs.map((j) => (
                  <button key={j} onClick={() => setTrackingId(j)} className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-600 text-xs rounded-lg hover:bg-purple-100 transition font-medium">{j}</button>
                ))}
              </div>
            </div>
          )}

          {tracking && (
            <div className="rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-4 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          )}

          {!tracking && trackResult && (
            <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div className={`px-5 py-3 flex items-center gap-2 text-white font-semibold text-sm ${trackResult.status === "Done" || trackResult.status === "เสร็จแล้ว" ? "bg-green-500" : trackResult.status === "In Progress" || trackResult.status === "กำลังทำ" ? "bg-blue-500" : "bg-amber-400"}`}>
                <span>{trackResult.status === "Done" || trackResult.status === "เสร็จแล้ว" ? "✅" : trackResult.status === "In Progress" || trackResult.status === "กำลังทำ" ? "🔄" : "⏳"}</span>
                <span>สถานะ: {trackResult.status}</span>
              </div>
              <div className={`${dark ? "bg-gray-800" : "bg-white"} divide-y ${dark ? "divide-gray-700" : "divide-gray-50"}`}>
                {[
                  { label: "📦 ประเภทงาน", value: trackResult.task },
                  { label: "📝 รายละเอียด", value: trackResult.detail },
                  { label: "👤 ลูกค้า", value: trackResult.customerName },
                  { label: "🧑‍💼 เซลล์", value: trackResult.agent },
                  { label: "📅 Deadline", value: trackResult.deadline },
                  { label: "🔗 Reference", value: trackResult.reference },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex gap-3 px-5 py-3">
                    <span className="text-gray-400 text-sm min-w-[130px]">{r.label}</span>
                    {r.label === "🔗 Reference" && r.value ? (
                      <a href={r.value} target="_blank" rel="noopener noreferrer" className="text-purple-500 text-sm font-medium hover:underline break-all">↗ {r.value}</a>
                    ) : (
                      <span className={`${dark ? "text-gray-200" : "text-gray-800"} text-sm font-medium break-all`}>{r.value}</span>
                    )}
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
