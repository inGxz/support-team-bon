"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// ─── LIFF ────────────────────────────────────────────────────────────────────
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

type LiffWindow = Window & {
  liff: {
    init: (config: { liffId: string }) => Promise<void>;
    isLoggedIn: () => boolean;
    login: (config?: { redirectUri?: string }) => void;
    getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl: string }>;
  };
};

// ─── TYPES ───────────────────────────────────────────────────────────────────
type JobDetail = {
  jobId: string;
  customerName: string;
  agent: string;
  task: string;
  reference: string;
  detail: string;
  deadline: string;
  status: string;
  subType: string;
  workflowParams: string;
  imageUrl: string;
  revisionNote: string;
};

type LogEntry = {
  timestamp: string;
  actor: string;
  field: string;
  oldValue: string;
  newValue: string;
};

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_STEPS = ["Pending", "In Progress", "Done", "Approved"];

const STATUS_LABEL: Record<string, string> = {
  Pending:     "รอดำเนินการ",
  "In Progress": "กำลังทำ",
  Done:        "เสร็จแล้ว",
  เสร็จแล้ว:   "เสร็จแล้ว",
  Approved:    "อนุมัติแล้ว",
  Revision:    "ขอแก้ไข",
};

const STATUS_COLOR: Record<string, string> = {
  Pending:       "bg-amber-100 text-amber-700 border border-amber-200",
  "In Progress": "bg-blue-100 text-blue-700 border border-blue-200",
  Done:          "bg-green-100 text-green-700 border border-green-200",
  เสร็จแล้ว:     "bg-green-100 text-green-700 border border-green-200",
  Approved:      "bg-purple-100 text-purple-700 border border-purple-200",
  Revision:      "bg-red-100 text-red-700 border border-red-200",
};

const FIELD_LABEL: Record<string, string> = {
  status:       "สถานะ",
  deliveryLink: "ลิงก์งาน",
  revisionNote: "หมายเหตุแก้ไข",
  priority:     "ความด่วน",
  created:      "สร้างงาน",
  approved:     "อนุมัติ",
  revision:     "ขอแก้ไข",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(raw: string): string {
  if (!raw) return "–";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(raw: string): string {
  if (!raw) return "–";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getStepIndex(status: string): number {
  const norm = status === "เสร็จแล้ว" ? "Done" : status;
  const idx  = STATUS_STEPS.indexOf(norm);
  return idx >= 0 ? idx : 0;
}

// ─── MAIN COMPONENT (wrapped for Suspense) ────────────────────────────────────
function JobPageContent() {
  const params = useSearchParams();
  const jobId  = params.get("jobId") || "";

  // LIFF / LINE
  const [lineUserId,  setLineUserId]  = useState("");
  const [liffReady,   setLiffReady]   = useState(false);
  const [liffError,   setLiffError]   = useState<string | null>(null);

  // Data
  const [job,         setJob]         = useState<JobDetail | null>(null);
  const [logs,        setLogs]        = useState<LogEntry[]>([]);
  const [deliveryLink, setDeliveryLink] = useState("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Actions
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [actionMsg,    setActionMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── init LIFF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!LIFF_ID) { setLiffReady(true); return; }
    const script = document.createElement("script");
    script.src   = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.onload = async () => {
      try {
        const liffWin = window as unknown as LiffWindow;
        await liffWin.liff.init({ liffId: LIFF_ID });
        if (!liffWin.liff.isLoggedIn()) {
          liffWin.liff.login({ redirectUri: window.location.href });
          return;
        }
        try {
          const profile = await liffWin.liff.getProfile();
          setLineUserId(profile.userId);
        } catch (profileErr: any) {
          // token หมดอายุ → login ใหม่
          const msg = String(profileErr).toLowerCase();
          if (msg.includes("expired") || msg.includes("token") || msg.includes("401")) {
            liffWin.liff.login({ redirectUri: window.location.href });
            return;
          }
          // ถ้า error อื่น ก็ยังใช้งานได้โดยไม่มี userId
        }
        setLiffReady(true);
      } catch (e: any) {
        const msg = String(e).toLowerCase();
        if (msg.includes("expired") || msg.includes("token") || msg.includes("401")) {
          // token หมดอายุ → login ใหม่
          try {
            const liffWin = window as unknown as LiffWindow;
            liffWin.liff.login({ redirectUri: window.location.href });
          } catch { /* ignore */ }
          return;
        }
        setLiffError(String(e));
        setLiffReady(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  // ── fetch job detail + log ─────────────────────────────────────────────────
  useEffect(() => {
    if (!liffReady || !jobId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const uidParam = lineUserId ? `&lineUserId=${encodeURIComponent(lineUserId)}` : "";

        // Parallel fetch
        const [jobRes, logRes] = await Promise.all([
          fetch(`/api/gas?jobId=${encodeURIComponent(jobId)}${uidParam}`),
          fetch(`/api/gas?action=jobLog&jobId=${encodeURIComponent(jobId)}${uidParam}`),
        ]);

        const jobData = await jobRes.json();
        const logData = await logRes.json();

        if (jobData.error) {
          setError(jobData.error === "FORBIDDEN" ? "คุณไม่มีสิทธิ์ดูงานนี้" : "ไม่พบงานนี้ในระบบ");
        } else {
          setJob(jobData);
        }

        if (!logData.error) {
          setLogs(logData.logs || []);
          if (logData.deliveryLink) setDeliveryLink(logData.deliveryLink);
        }
      } catch (e: any) {
        setError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    })();
  }, [liffReady, jobId, lineUserId]);

  // ── approve ────────────────────────────────────────────────────────────────
  async function handleApprove() {
    if (!job || submitting) return;
    setSubmitting(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.jobId, lineUserId }),
      });
      const d = await res.json();
      if (d.ok || d.success) {
        setJob(prev => prev ? { ...prev, status: "Approved" } : prev);
        setActionMsg({ type: "ok", text: "✅ อนุมัติงานเรียบร้อยแล้ว" });
      } else {
        setActionMsg({ type: "err", text: d.message || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setActionMsg({ type: "err", text: "เชื่อมต่อระบบไม่ได้" });
    } finally {
      setSubmitting(false);
    }
  }

  // ── revision ───────────────────────────────────────────────────────────────
  async function handleRevision() {
    if (!job || submitting || !revisionNote.trim()) return;
    setSubmitting(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revision", jobId: job.jobId, lineUserId, note: revisionNote.trim() }),
      });
      const d = await res.json();
      if (d.ok || d.success) {
        setJob(prev => prev ? { ...prev, status: "Revision" } : prev);
        setShowRevision(false);
        setRevisionNote("");
        setActionMsg({ type: "ok", text: "📝 ส่งคำขอแก้ไขแล้ว ทีมงานจะติดต่อกลับ" });
      } else {
        setActionMsg({ type: "err", text: d.message || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setActionMsg({ type: "err", text: "เชื่อมต่อระบบไม่ได้" });
    } finally {
      setSubmitting(false);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────
  if (!liffReady || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#f7f6f2" }}>
        <div className="w-10 h-10 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูลงาน…</p>
      </div>
    );
  }

  if (liffError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f7f6f2" }}>
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm text-gray-600 text-center">LINE login error: {liffError}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f7f6f2" }}>
        <div className="text-5xl mb-4">🔒</div>
        <p className="font-semibold text-gray-800 mb-1">ไม่พบข้อมูล</p>
        <p className="text-sm text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  if (!job) return null;

  const stepIdx    = getStepIndex(job.status);
  const isDone     = job.status === "Done" || job.status === "เสร็จแล้ว" || job.status === "Approved";
  const canApprove = job.status === "Done" || job.status === "เสร็จแล้ว";
  const canRevise  = job.status === "Done" || job.status === "เสร็จแล้ว" || job.status === "In Progress";
  const dl         = deliveryLink || job.imageUrl || "";

  return (
    <div className="min-h-screen pb-10" style={{ background: "#f7f6f2", fontFamily: "'Noto Sans Thai', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b2e 0%, #2d2657 100%)" }} className="px-4 pt-10 pb-6">
        <p className="text-xs text-indigo-300 mb-1">Job #{job.jobId}</p>
        <h1 className="text-white text-xl font-bold leading-snug">{job.task}</h1>
        {job.subType && <p className="text-indigo-200 text-sm mt-1">{job.subType}</p>}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[job.status] || "bg-gray-100 text-gray-600"}`}>
            {STATUS_LABEL[job.status] || job.status}
          </span>
          {job.deadline && (
            <span className="text-xs text-indigo-200">📅 {fmtDate(job.deadline)}</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mx-4 -mt-3 bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, idx) => {
            const active  = idx === stepIdx;
            const past    = idx < stepIdx;
            const isRevision = job.status === "Revision";
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                {/* connector line */}
                <div className="flex items-center w-full">
                  {idx > 0 && (
                    <div className={`flex-1 h-1 rounded-full ${past || active ? "bg-indigo-500" : "bg-gray-200"}`} />
                  )}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${active && isRevision ? "border-red-400 bg-red-50 text-red-500" :
                      active ? "border-indigo-600 bg-indigo-600 text-white" :
                      past   ? "border-indigo-400 bg-indigo-50 text-indigo-600" :
                               "border-gray-200 bg-white text-gray-400"}`}>
                    {past ? "✓" : isRevision && active ? "!" : idx + 1}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 rounded-full ${past ? "bg-indigo-500" : "bg-gray-200"}`} />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center leading-tight
                  ${active ? "text-indigo-700 font-semibold" : past ? "text-indigo-400" : "text-gray-300"}`}>
                  {step === "In Progress" ? "กำลังทำ" : step === "Pending" ? "รอ" : step === "Done" ? "เสร็จ" : "อนุมัติ"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div className={`mx-4 mb-4 rounded-xl p-3 text-sm text-center font-medium
          ${actionMsg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {actionMsg.text}
        </div>
      )}

      {/* Delivery Link */}
      {dl && (
        <div className="mx-4 mb-4">
          <a href={dl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-semibold text-sm shadow"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <span>📦</span> ดูผลงาน / ดาวน์โหลด
          </a>
        </div>
      )}

      {/* Job Details Card */}
      <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">รายละเอียดงาน</h2>
        <div className="space-y-3">
          <Row label="ชื่อลูกค้า" value={job.customerName} />
          <Row label="ผู้รับผิดชอบ" value={job.agent} />
          {job.detail && <Row label="รายละเอียด" value={job.detail} />}
          {job.reference && <Row label="อ้างอิง" value={job.reference} />}
          {job.revisionNote && (
            <Row label="หมายเหตุแก้ไข" value={job.revisionNote} highlight />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {(canApprove || canRevise) && (
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">การดำเนินการ</h2>

          {canApprove && (
            <button onClick={handleApprove} disabled={submitting}
              className="w-full mb-2 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#7c3aed" }}>
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "✅"}
              อนุมัติงาน
            </button>
          )}

          {canRevise && !showRevision && (
            <button onClick={() => setShowRevision(true)}
              className="w-full py-3 rounded-xl text-red-600 font-semibold text-sm border border-red-200 bg-red-50 flex items-center justify-center gap-2">
              ✏️ ขอแก้ไขงาน
            </button>
          )}

          {showRevision && (
            <div className="mt-2">
              <textarea
                value={revisionNote}
                onChange={e => setRevisionNote(e.target.value)}
                placeholder="ระบุรายละเอียดที่ต้องการแก้ไข…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setShowRevision(false); setRevisionNote(""); }}
                  className="flex-1 py-2 rounded-xl text-gray-500 text-sm border border-gray-200">
                  ยกเลิก
                </button>
                <button onClick={handleRevision} disabled={!revisionNote.trim() || submitting}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#ef4444" }}>
                  {submitting ? "กำลังส่ง…" : "ส่งคำขอ"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      {logs.length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ความเคลื่อนไหว</h2>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 pl-8 relative">
                  <div className="absolute left-2 top-1 w-2.5 h-2.5 rounded-full bg-indigo-200 border-2 border-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{fmtDateTime(log.timestamp)}</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {log.field === "status" ? (
                        <>
                          <span className="font-medium">{log.actor}</span>
                          {" เปลี่ยนสถานะ "}
                          <span className="text-gray-400">{log.oldValue || "–"}</span>
                          {" → "}
                          <span className="font-semibold text-indigo-600">{log.newValue}</span>
                        </>
                      ) : log.field === "deliveryLink" ? (
                        <>
                          <span className="font-medium">{log.actor}</span>
                          {" อัปโหลดผลงานแล้ว 📦"}
                        </>
                      ) : log.field === "created" ? (
                        <><span className="font-medium">สร้างงาน</span> เรียบร้อย</>
                      ) : (
                        <>
                          <span className="font-medium">{log.actor}</span>
                          {` อัปเดต ${FIELD_LABEL[log.field] || log.field}: `}
                          <span className="text-gray-500">{log.newValue}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-4">SUPPORT TEAMBON VT MARKET</p>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm leading-snug ${highlight ? "text-red-600 font-medium" : "text-gray-800"}`}>{value || "–"}</p>
    </div>
  );
}

// ─── Export with Suspense (for useSearchParams) ───────────────────────────────
export default function JobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f6f2" }}>
        <div className="w-10 h-10 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />
      </div>
    }>
      <JobPageContent />
    </Suspense>
  );
}
