"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

type LiffWindow = Window & {
  liff: {
    init: (config: { liffId: string }) => Promise<void>;
    isLoggedIn: () => boolean;
    login: (config?: { redirectUri?: string }) => void;
    getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl: string }>;
  };
};

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
  if (status === "Pending") return 0;
  if (status === "In Progress" || status === "กำลังทำ") return 1;
  if (status === "Done" || status === "เสร็จแล้ว") return 2;
  if (status === "Approved") return 3;
  return 0;
}

function tlDotColor(field: string, newValue: string): string {
  if (field === "created") return "#888780";
  if (newValue === "Approved") return "#7c3aed";
  if (newValue === "Done" || newValue === "เสร็จแล้ว") return "#15803d";
  if (newValue === "In Progress" || newValue === "กำลังทำ") return "#60a5fa";
  if (newValue === "Revision" || field === "revision") return "#f87171";
  if (field === "deliveryLink") return "#4ade80";
  return "#888780";
}

function tlEventText(log: LogEntry): string {
  if (log.field === "created") return "รับงานเข้าระบบ";
  if (log.field === "deliveryLink") return "อัปโหลดไฟล์งานแล้ว";
  if (log.field === "status") {
    const v = log.newValue;
    if (v === "Done" || v === "เสร็จแล้ว") return "งานเสร็จแล้ว (Done)";
    if (v === "In Progress" || v === "กำลังทำ") return "เริ่มดำเนินการ (In Progress)";
    if (v === "Approved") return "อนุมัติงานแล้ว ✅";
    if (v === "Revision") return "ขอแก้ไขงาน";
    return `เปลี่ยนสถานะ → ${v}`;
  }
  if (log.field === "revision") return `ขอแก้ไข: ${log.newValue}`;
  if (log.field === "revisionNote") return `หมายเหตุ: ${log.newValue}`;
  return `${log.field}: ${log.newValue}`;
}

function JobPageContent() {
  const params      = useSearchParams();
  const jobId       = params.get("jobId") || "";
  const isFreelancer = params.get("fl") === "1";

  const [lineUserId,   setLineUserId]   = useState("");
  const [liffReady,    setLiffReady]    = useState(false);
  const [job,          setJob]          = useState<JobDetail | null>(null);
  const [logs,         setLogs]         = useState<LogEntry[]>([]);
  const [deliveryLink, setDeliveryLink] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [actionMsg,    setActionMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [approved,     setApproved]     = useState(false);
  const [internalNote, setInternalNote] = useState("");

  // init LIFF
  useEffect(() => {
    if (!LIFF_ID) { setLiffReady(true); return; }
    const script    = document.createElement("script");
    script.src      = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.onload   = async () => {
      try {
        const w = window as unknown as LiffWindow;
        await w.liff.init({ liffId: LIFF_ID });
        if (w.liff.isLoggedIn()) {
          try {
            const p = await w.liff.getProfile();
            setLineUserId(p.userId);
          } catch { /* ข้าม */ }
        }
      } catch { /* ข้าม */ }
      setLiffReady(true);
    };
    script.onerror  = () => setLiffReady(true);
    document.head.appendChild(script);
  }, []);

  // fetch data
  useEffect(() => {
    if (!liffReady || !jobId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const uid    = lineUserId ? `&lineUserId=${encodeURIComponent(lineUserId)}` : "";
        const source = isFreelancer ? "freelancer" : "customer";
        const [jr, lr] = await Promise.all([
          fetch(`/api/gas?jobId=${encodeURIComponent(jobId)}${uid}&source=${source}`),
          fetch(`/api/gas?action=jobLog&jobId=${encodeURIComponent(jobId)}${uid}&source=${source}`),
        ]);
        const jd = await jr.json();
        const ld = await lr.json();
        if (jd.error) {
          setError(jd.error === "FORBIDDEN" ? "คุณไม่มีสิทธิ์ดูงานนี้" : "ไม่พบงานนี้ในระบบ");
        } else {
          setJob(jd);
          if (jd.status === "Approved") setApproved(true);
          if (jd.internalNote) setInternalNote(jd.internalNote);
        }
        if (!ld.error) {
          setLogs(ld.logs || []);
          if (ld.deliveryLink) setDeliveryLink(ld.deliveryLink);
        }
      } catch {
        setError("เชื่อมต่อระบบไม่ได้ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    })();
  }, [liffReady, jobId, lineUserId]);

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
      if (d.ok || d.success || d.alreadyApproved) {
        setApproved(true);
        setJob(prev => prev ? { ...prev, status: "Approved" } : prev);
        setActionMsg({ type: "ok", text: "✅ Approve งานเรียบร้อยแล้ว" });
      } else {
        setActionMsg({ type: "err", text: d.message || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setActionMsg({ type: "err", text: "เชื่อมต่อระบบไม่ได้" });
    } finally {
      setSubmitting(false);
    }
  }

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

  // ── loading / error ────────────────────────────────────────────────────────
  if (!liffReady || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #c4b5fd", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 12, fontSize: 13, color: "#888780" }}>กำลังโหลดข้อมูลงาน…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <p style={{ fontWeight: 600, color: "#1e1b2e", marginBottom: 4 }}>ไม่พบข้อมูล</p>
        <p style={{ fontSize: 13, color: "#888780", textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  if (!job) return null;

  const stepIdx   = getStepIndex(job.status);
  const isRevision = job.status === "Revision";
  const isDone    = job.status === "Done" || job.status === "เสร็จแล้ว";
  const isApproved = approved || job.status === "Approved";
  const canApprove = isDone && !isApproved;
  const canRevise  = (isDone || job.status === "In Progress") && !isApproved;
  const dl        = deliveryLink || job.imageUrl || "";

  const STEPS = [
    { label: "รับงาน" },
    { label: "กำลังทำ" },
    { label: "Done" },
    { label: "Approve" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", fontFamily: "'Noto Sans Thai', sans-serif", maxWidth: 480, margin: "0 auto" }}>

      {/* Freelancer banner */}
      {isFreelancer && (
        <div style={{ background: "#fef9c3", borderBottom: "1px solid #fde047", padding: "8px 16px", fontSize: 12, color: "#854d0e", fontWeight: 500, textAlign: "center" }}>
          🔗 Freelancer View — คุณเห็น Note ภายในของงานนี้
        </div>
      )}

      {/* Top Bar */}
      <div style={{ background: "#1e1b2e", padding: isFreelancer ? "14px 16px" : "44px 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => window.history.back()}
          style={{ width: 32, height: 32, borderRadius: 8, background: "#2d2a3e", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <svg width="16" height="16" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 500, letterSpacing: 1 }}>{job.jobId}</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginTop: 1 }}>{job.task}</div>
        </div>
      </div>

      <div style={{ background: "#fff", margin: "0 0 8px" }}>

        {/* Status Hero */}
        <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #ebe9e1", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#888780", marginBottom: 4 }}>สถานะปัจจุบัน</div>
            <StatusBadge status={isApproved ? "Approved" : job.status} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>Deadline</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#1e1b2e", marginTop: 2 }}>{fmtDate(job.deadline)}</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #ebe9e1" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#888780", marginBottom: 10 }}>ความคืบหน้า</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {STEPS.map((s, idx) => {
              const past   = idx < stepIdx;
              const active = idx === stepIdx;
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? "1" : "unset" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 500,
                      background: past ? "#15803d" : active ? "#4f46e5" : "#f1f0ed",
                      color: past || active ? "#fff" : "#888780",
                      border: past || active ? "none" : "0.5px solid #ebe9e1",
                    }}>
                      {past ? <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                           : active ? <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                           : null}
                    </div>
                    <div style={{ fontSize: 9, marginTop: 4, color: past ? "#15803d" : active ? "#4f46e5" : "#888780", fontWeight: active ? 500 : 400 }}>
                      {s.label}
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1.5, background: past ? "#15803d" : "#ebe9e1", marginBottom: 14 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #ebe9e1" }}>
          <SectionHeader label="รายละเอียดงาน" color="#a78bfa" />
          <InfoRow label="ประเภท" value={[job.task, job.subType].filter(Boolean).join(" · ")} />
          <InfoRow label="เซลล์" value={job.agent} />
          {job.reference && <InfoRow label="Reference" value={job.reference} link />}
          {job.detail && (
            <div style={{ marginTop: 8, background: "#fafaf8", border: "0.5px solid #ebe9e1", borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.6, color: "#444441" }}>
              {job.detail}
            </div>
          )}
          {job.revisionNote && (
            <div style={{ marginTop: 8, background: "#fff5f5", border: "0.5px solid #fca5a5", borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.6, color: "#b91c1c" }}>
              📝 {job.revisionNote}
            </div>
          )}
          {isFreelancer && internalNote && (
            <div style={{ marginTop: 8, background: "#fefce8", border: "0.5px solid #fde047", borderRadius: 8, padding: "10px 12px", fontSize: 12, lineHeight: 1.6, color: "#854d0e" }}>
              🔒 <span style={{ fontWeight: 600 }}>Note จากทีมงาน:</span> {internalNote}
            </div>
          )}
        </div>

        {/* Delivery */}
        {dl && (
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #ebe9e1" }}>
            <SectionHeader label="ไฟล์งาน" color="#4ade80" />
            <div style={{ background: "#f0fdf4", border: "0.5px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "#dcfce7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#15803d" }}>งานเสร็จแล้ว — เปิดดูได้เลย</div>
                <div style={{ fontSize: 10, color: "#4ade80", marginTop: 1 }}>Google Drive · คลิกเพื่อเปิด</div>
              </div>
              <a href={dl} target="_blank" rel="noopener noreferrer"
                style={{ background: "#15803d", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
                เปิดไฟล์
              </a>
            </div>
          </div>
        )}

        {/* Timeline */}
        {logs.length > 0 && (
          <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #ebe9e1" }}>
            <SectionHeader label="ประวัติงาน" color="#fbbf24" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {logs.map((log, i) => (
                <li key={i} style={{ display: "flex", gap: 10, marginBottom: i < logs.length - 1 ? 12 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: tlDotColor(log.field, log.newValue), flexShrink: 0, marginTop: 3 }} />
                    {i < logs.length - 1 && <div style={{ flex: 1, width: 1, background: "#ebe9e1", marginTop: 3 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#1e1b2e", fontWeight: 500 }}>{tlEventText(log)}</div>
                    <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>{fmtDateTime(log.timestamp)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div style={{
          margin: "0 12px 8px",
          padding: "10px 14px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          textAlign: "center",
          background: actionMsg.type === "ok" ? "#f0fdf4" : "#fff5f5",
          color:      actionMsg.type === "ok" ? "#15803d"  : "#b91c1c",
          border:     actionMsg.type === "ok" ? "0.5px solid #bbf7d0" : "0.5px solid #fca5a5",
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* Revision textarea */}
      {showRevision && (
        <div style={{ background: "#fff", margin: "0 0 8px", padding: "14px 16px" }}>
          <div style={{ fontSize: 12, color: "#888780", marginBottom: 8 }}>ระบุรายละเอียดที่ต้องการแก้ไข</div>
          <textarea
            value={revisionNote}
            onChange={e => setRevisionNote(e.target.value)}
            placeholder="เช่น เปลี่ยนสีพื้นหลัง, ปรับขนาดตัวอักษร…"
            rows={3}
            style={{ width: "100%", border: "0.5px solid #ebe9e1", borderRadius: 8, padding: "10px 12px", fontSize: 12, resize: "none", outline: "none", background: "#fafaf8", color: "#1e1b2e" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => { setShowRevision(false); setRevisionNote(""); }}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "0.5px solid #ebe9e1", background: "#fff", color: "#888780", fontSize: 13, cursor: "pointer" }}>
              ยกเลิก
            </button>
            <button onClick={handleRevision} disabled={!revisionNote.trim() || submitting}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: (!revisionNote.trim() || submitting) ? 0.6 : 1 }}>
              {submitting ? "กำลังส่ง…" : "ส่งคำขอ"}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ padding: "14px 16px 32px", display: "flex", gap: 8 }}>
        {isApproved ? (
          <div style={{ flex: 1, background: "#f0fdf4", color: "#15803d", border: "0.5px solid #bbf7d0", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 500, textAlign: "center" }}>
            ✅ Approved แล้ว
          </div>
        ) : (canApprove || canRevise) ? (
          <>
            {canApprove && (
              <button onClick={handleApprove} disabled={submitting}
                style={{ flex: 1, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> : (
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                )}
                Approve งาน
              </button>
            )}
            {canRevise && !showRevision && (
              <button onClick={() => setShowRevision(true)}
                style={{ flex: 1, background: "#fff", color: "#b91c1c", border: "0.5px solid #fca5a5", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer" }}>
                <svg width="16" height="16" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.07-4.27"/></svg>
                ขอแก้ไข
              </button>
            )}
          </>
        ) : null}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    "Approved":    { bg: "#ede9fe", color: "#5b21b6", dot: "#7c3aed",  label: "Approved ✅" },
    "Done":        { bg: "#dcfce7", color: "#15803d", dot: "#15803d",  label: "Done — รอ Approve" },
    "เสร็จแล้ว":  { bg: "#dcfce7", color: "#15803d", dot: "#15803d",  label: "Done — รอ Approve" },
    "In Progress": { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6",  label: "In Progress" },
    "กำลังทำ":    { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6",  label: "In Progress" },
    "Revision":    { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444",  label: "ขอแก้ไข" },
    "Pending":     { bg: "#fef9c3", color: "#854d0e", dot: "#f59e0b",  label: "รอดำเนินการ" },
  };
  const c = cfg[status] || cfg["Pending"];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: c.bg }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: c.color }}>{c.label}</span>
    </div>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <div style={{ width: 3, height: 12, background: color, borderRadius: 0 }} />
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", color: "#888780" }}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#888780", flexShrink: 0, width: 72 }}>{label}</span>
      <span style={{ fontSize: 12, color: link ? "#4f46e5" : "#1e1b2e", textAlign: "right", flex: 1 }}>{value || "–"}</span>
    </div>
  );
}

export default function JobPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#F8F7F4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #c4b5fd", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <JobPageContent />
    </Suspense>
  );
}
