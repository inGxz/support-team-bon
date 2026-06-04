"use client";

import { useEffect, useState } from "react";

const GAS_URL = "/api/gas";

type JobBrief = {
  jobId: string;
  task: string;
  subType: string;
  workflowParams: string;
  deadline: string;
  detail: string;
  reference: string;
  imageUrl: string;
  revisionNote: string;
  internalNote: string;
  status: string;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  } catch { return 0; }
}

function getWorkflowColor(task: string) {
  const t = (task || "").toLowerCase();
  if (t.includes("video"))   return { bg: "from-pink-500 to-rose-500",   badge: "bg-pink-100 text-pink-700 border-pink-200",   icon: "🎬" };
  if (t.includes("design"))  return { bg: "from-cyan-500 to-blue-500",   badge: "bg-cyan-100 text-cyan-700 border-cyan-200",   icon: "🎨" };
  if (t.includes("ads"))     return { bg: "from-orange-500 to-red-500",  badge: "bg-orange-100 text-orange-700 border-orange-200", icon: "📢" };
  if (t.includes("content")) return { bg: "from-emerald-500 to-teal-500",badge: "bg-emerald-100 text-emerald-700 border-emerald-200",icon: "✍️" };
  if (t.includes("film"))    return { bg: "from-violet-500 to-purple-500",badge: "bg-violet-100 text-violet-700 border-violet-200", icon: "🎥" };
  return { bg: "from-purple-500 to-indigo-500", badge: "bg-purple-100 text-purple-700 border-purple-200", icon: "📋" };
}

export default function BriefPage() {
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<JobBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("jobId") || "";
    setJobId(id);
    if (!id) {
      setLoading(false);
      setError("ไม่มี Job ID ใน URL");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    fetch(`${GAS_URL}?jobId=${encodeURIComponent(id)}&source=brief`, { signal: controller.signal })
      .then((r) => r.text())
      .then((text) => {
        clearTimeout(timer);
        try {
          const data = JSON.parse(text);
          if (data.error) {
            setError(`ไม่พบงาน Job ID: ${id}`);
          } else {
            setJob(data);
          }
        } catch {
          setError("โหลดข้อมูลไม่สำเร็จ");
        }
      })
      .catch(() => setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่"))
      .finally(() => setLoading(false));

    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  const wfColor = getWorkflowColor(job?.task || "");
  const days = job ? daysUntil(job.deadline) : 0;
  const deadlineUrgent = days >= 0 && days <= 3;
  const deadlineOverdue = days < 0;

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">กำลังโหลด Brief...</p>
        </div>
      </main>
    );
  }

  // ─── Error ─────────────────────────────────────────────────
  if (error || !job) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-5xl">😕</p>
          <p className="font-bold text-gray-700 text-lg">ไม่พบ Brief</p>
          <p className="text-gray-400 text-sm">{error || "Job ID ไม่ถูกต้อง"}</p>
          <button onClick={() => window.location.reload()} className="w-full py-2.5 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 transition">
            🔄 ลองใหม่
          </button>
        </div>
      </main>
    );
  }

  const params = job.workflowParams
    ? job.workflowParams.split("|").map((p) => p.trim()).filter(Boolean)
    : [];

  // ─── Brief View ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <div className={`rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br ${wfColor.bg}`}>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1">Job Brief</p>
                <h1 className="text-white font-black text-2xl tracking-wide">{jobId}</h1>
                <p className="text-white/80 text-sm mt-1">SUPPORT TEAMBON VT MARKET</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  deadlineOverdue ? "bg-red-100 text-red-700 border-red-300" :
                  deadlineUrgent  ? "bg-amber-100 text-amber-700 border-amber-300" :
                                    "bg-white/90 text-gray-700 border-white/50"
                }`}>
                  📅 {formatDate(job.deadline)}
                </div>
                {deadlineOverdue ? (
                  <p className="text-red-200 text-xs mt-1 font-semibold">⚠️ เกิน Deadline แล้ว</p>
                ) : deadlineUrgent ? (
                  <p className="text-amber-200 text-xs mt-1 font-semibold">🔥 อีก {days} วัน</p>
                ) : (
                  <p className="text-white/60 text-xs mt-1">อีก {days} วัน</p>
                )}
              </div>
            </div>
          </div>
          {/* Bottom strip */}
          <div className="bg-black/20 px-6 py-2.5 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${wfColor.badge} bg-white/90`}>
              {wfColor.icon} {job.task}
            </span>
            {job.subType && (
              <span className="text-xs font-semibold text-white/90 bg-white/20 px-2.5 py-1 rounded-full border border-white/30">
                {job.subType}
              </span>
            )}
          </div>
        </div>

        {/* Workflow params */}
        {params.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">⚙️ Workflow Parameters</p>
            <div className="flex flex-wrap gap-2">
              {params.map((p, i) => {
                const [key, ...rest] = p.split(":");
                const val = rest.join(":").trim();
                return (
                  <div key={i} className="flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-purple-400 font-medium">{key.trim()}:</span>
                    <span className="text-xs text-purple-700 font-bold">{val || key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detail */}
        {job.detail && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">📝 รายละเอียดงาน</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{job.detail}</p>
          </div>
        )}

        {/* Reference */}
        {job.reference && (
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 px-5 py-4">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">🔗 ลิ้งอ้างอิง</p>
            {job.reference.startsWith("http") ? (
              <a href={job.reference} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 underline break-all hover:text-blue-800">
                {job.reference}
              </a>
            ) : (
              <p className="text-sm text-amber-800 break-all">{job.reference}</p>
            )}
          </div>
        )}

        {/* Images */}
        {job.imageUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                🖼️ รูปอ้างอิง ({job.imageUrl.split(",").filter(Boolean).length} รูป)
              </p>
            </div>
            {job.imageUrl.split(",").filter(Boolean).map((url, idx) => (
              <div key={idx} className="border-b border-gray-50 last:border-0">
                <img
                  src={url.trim()}
                  alt={`รูปที่ ${idx + 1}`}
                  className="w-full max-h-72 object-contain bg-gray-50 cursor-pointer"
                  onClick={() => window.open(url.trim(), "_blank")}
                />
                <div className="flex items-center justify-between px-4 py-2 bg-white">
                  <span className="text-xs text-gray-500 font-medium">รูปที่ {idx + 1}</span>
                  <a href={url.trim()} target="_blank" rel="noopener noreferrer"
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded-full transition">
                    ↗ ขยาย
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revision note */}
        {job.revisionNote && (
          <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 px-5 py-4">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">🔄 หมายเหตุการแก้ไข</p>
            <p className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed">{job.revisionNote}</p>
          </div>
        )}

        {/* Internal note สำหรับฟรีแลนซ์ */}
        {job.internalNote && (
          <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 px-5 py-4">
            <p className="text-xs font-bold text-yellow-600 uppercase tracking-wide mb-2">🔒 Note จากทีมงาน</p>
            <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">{job.internalNote}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">SUPPORT TEAMBON VT MARKET</p>
          <p className="text-xs text-gray-300 mt-0.5">Brief ID: {jobId}</p>
        </div>

      </div>
    </main>
  );
}
