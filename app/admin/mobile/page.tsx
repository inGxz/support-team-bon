"use client";

import { useEffect, useState, useMemo } from "react";

type Job = {
  jobId: string;
  customerName: string;
  agent: string;
  task: string;
  status: string;
  deadline: string;
  deliveryLink: string;
  priority: string;
  revisionCount: string;
};

type Tab = "home" | "search" | "report" | "settings";
type Filter = "all" | "overdue" | "revision" | "pending" | "inprogress";

function isOverdue(deadline: string, status: string): boolean {
  if (!deadline) return false;
  if (["Done", "เสร็จแล้ว", "Approved"].includes(status)) return false;
  try { return new Date(deadline) < new Date(); } catch { return false; }
}

function isDueTomorrow(deadline: string, status: string): boolean {
  if (!deadline) return false;
  if (["Done", "เสร็จแล้ว", "Approved"].includes(status)) return false;
  try {
    const d = new Date(deadline); d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    const tom = new Date(t); tom.setDate(tom.getDate() + 1);
    return d.getTime() === tom.getTime();
  } catch { return false; }
}

const STATUS_LIST = ["Pending","In Progress","Revision","Done","Approved"];

function statusBadge(s: string) {
  const map: Record<string, string> = {
    "Pending":     "bg-amber-100 text-amber-800",
    "In Progress": "bg-blue-100 text-blue-800",
    "Revision":    "bg-red-100 text-red-800",
    "Done":        "bg-green-100 text-green-800",
    "Approved":    "bg-emerald-100 text-emerald-800",
  };
  return map[s] || "bg-gray-100 text-gray-700";
}

function statusBtn(s: string) {
  const map: Record<string, string> = {
    "Pending":     "bg-amber-50 text-amber-800 border-amber-200",
    "In Progress": "bg-blue-50 text-blue-800 border-blue-200",
    "Revision":    "bg-red-50 text-red-800 border-red-200",
    "Done":        "bg-green-50 text-green-800 border-green-200",
    "Approved":    "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return map[s] || "bg-gray-50 text-gray-700 border-gray-200";
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pw.trim()) return;
    setLoading(true); setErr(false);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) { sessionStorage.setItem("adminAuth", pw); onLogin(pw); }
      else { setErr(true); }
    } catch { setErr(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f1f0ed" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#1e1b2e" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <p className="font-medium text-lg" style={{ color: "#1e1b2e" }}>Support Teambon</p>
          <p className="text-xs mt-1" style={{ color: "#888780", letterSpacing: "2px", textTransform: "uppercase" }}>VT Market · Admin</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#ebe9e1" }}>
          <p className="text-sm font-medium mb-3" style={{ color: "#1e1b2e" }}>รหัสผ่าน Admin</p>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="ใส่รหัสผ่าน..."
            className="w-full rounded-xl px-4 py-3 text-sm outline-none border"
            style={{ background: "#fafaf8", borderColor: err ? "#fca5a5" : "#ebe9e1", color: "#1e1b2e" }}
          />
          {err && <p className="text-xs mt-2" style={{ color: "#dc2626" }}>รหัสผ่านไม่ถูกต้อง</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !pw.trim()}
            className="w-full mt-4 py-3 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
            style={{ background: "#4f46e5" }}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MobileAdmin() {
  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);
  const [deliveryInput, setDeliveryInput] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("adminAuth");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  const fetchJobs = async () => {
    if (!token) return;
    setLoading(true); setFetchError("");
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : null;
      if (list) {
        setJobs(list);
      } else {
        setFetchError(`API error: ${JSON.stringify(data).substring(0, 120)}`);
      }
    } catch (err) {
      setFetchError(`Fetch failed: ${String(err)}`);
    }
    finally { setLoading(false); }
  };

  // Stats
  const stats = useMemo(() => {
    const total = jobs.length;
    const done = jobs.filter(j => ["Done","เสร็จแล้ว","Approved"].includes(j.status)).length;
    const inProgress = jobs.filter(j => j.status === "In Progress").length;
    const overdue = jobs.filter(j => isOverdue(j.deadline, j.status)).length;
    const dueTomorrow = jobs.filter(j => isDueTomorrow(j.deadline, j.status));
    return { total, done, inProgress, overdue, dueTomorrow };
  }, [jobs]);

  // Filtered jobs
  const filtered = useMemo(() => {
    let list = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        j.jobId.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.task.toLowerCase().includes(q) ||
        j.agent.toLowerCase().includes(q)
      );
    }
    if (filter === "overdue")    list = list.filter(j => isOverdue(j.deadline, j.status));
    if (filter === "revision")   list = list.filter(j => j.status === "Revision");
    if (filter === "pending")    list = list.filter(j => j.status === "Pending");
    if (filter === "inprogress") list = list.filter(j => j.status === "In Progress");
    // sort: overdue first, then by deadline
    list.sort((a, b) => {
      const ao = isOverdue(a.deadline, a.status) ? 0 : 1;
      const bo = isOverdue(b.deadline, b.status) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return (a.deadline || "").localeCompare(b.deadline || "");
    });
    return list;
  }, [jobs, filter, search]);

  const handleSelectJob = (j: Job) => {
    setSelectedJob(j);
    setDeliveryInput(j.deliveryLink || "");
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedJob || !token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: selectedJob.jobId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success || !data.error) {
        setJobs(prev => prev.map(j => j.jobId === selectedJob.jobId ? { ...j, status: newStatus } : j));
        setSelectedJob(prev => prev ? { ...prev, status: newStatus } : null);
        setSavedIds(prev => new Set(prev).add(selectedJob.jobId + "_status"));
        setTimeout(() => setSavedIds(prev => { const s = new Set(prev); s.delete(selectedJob.jobId + "_status"); return s; }), 2000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const handleSaveDelivery = async () => {
    if (!selectedJob || !token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: selectedJob.jobId, deliveryLink: deliveryInput }),
      });
      const data = await res.json();
      if (data.success || !data.error) {
        setJobs(prev => prev.map(j => j.jobId === selectedJob.jobId ? { ...j, deliveryLink: deliveryInput } : j));
        setSelectedJob(prev => prev ? { ...prev, deliveryLink: deliveryInput } : null);
        setSavedIds(prev => new Set(prev).add(selectedJob.jobId + "_link"));
        setTimeout(() => setSavedIds(prev => { const s = new Set(prev); s.delete(selectedJob.jobId + "_link"); return s; }), 2000);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  if (!token) return <LoginScreen onLogin={setToken} />;

  // ─── Report Tab ─────────────────────────────────────────────────────────────
  if (tab === "report") {
    const total = jobs.length;
    const done = jobs.filter(j => ["Done","เสร็จแล้ว","Approved"].includes(j.status)).length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const wfMap: Record<string, { total: number; done: number }> = {};
    jobs.forEach(j => {
      const wf = j.task?.includes("Video") || j.task?.includes("TikTok") || j.task?.includes("Reels") ? "Video"
        : j.task?.includes("Ads") ? "Ads" : "Design";
      if (!wfMap[wf]) wfMap[wf] = { total: 0, done: 0 };
      wfMap[wf].total++;
      if (["Done","เสร็จแล้ว","Approved"].includes(j.status)) wfMap[wf].done++;
    });

    return (
      <div className="min-h-screen" style={{ background: "#fafaf8", fontFamily: "var(--font-sans, sans-serif)" }}>
        <div style={{ background: "#1e1b2e", padding: "16px" }} className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white text-sm">รายงาน</p>
            <p className="text-xs mt-0.5" style={{ color: "#6b6880", letterSpacing: "1px", textTransform: "uppercase" }}>Support Teambon</p>
          </div>
          <button onClick={fetchJobs} className="p-2 rounded-lg" style={{ background: "#2d2a3e" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#ebe9e1" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#888780", letterSpacing: "1px", textTransform: "uppercase" }}>ภาพรวมเดือนนี้</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "ทั้งหมด", val: total, color: "#4f46e5" },
                { label: "Done", val: done, color: "#15803d" },
                { label: "In Progress", val: stats.inProgress, color: "#1d4ed8" },
                { label: "Overdue", val: stats.overdue, color: "#dc2626" },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3" style={{ background: "#f1f0ed" }}>
                  <p className="text-xs mb-1" style={{ color: "#888780" }}>{s.label}</p>
                  <p className="text-2xl font-medium" style={{ color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#ebe9e1" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#888780", letterSpacing: "1px", textTransform: "uppercase" }}>Completion Rate</p>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-3xl font-medium" style={{ color: "#15803d" }}>{rate}%</p>
              <p className="text-xs" style={{ color: "#888780" }}>({done}/{total} งาน)</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#f1f0ed" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: "#4ade80" }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#ebe9e1" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "#888780", letterSpacing: "1px", textTransform: "uppercase" }}>แยกตาม Workflow</p>
            <div className="space-y-3">
              {Object.entries(wfMap).map(([wf, v]) => {
                const pct = v.total ? Math.round((v.done / v.total) * 100) : 0;
                return (
                  <div key={wf}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#1e1b2e" }}>{wf}</span>
                      <span style={{ color: "#888780" }}>{v.done}/{v.total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f0ed" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#a78bfa" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <BottomTab tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ─── Settings Tab ────────────────────────────────────────────────────────────
  if (tab === "settings") {
    return (
      <div className="min-h-screen" style={{ background: "#fafaf8", fontFamily: "var(--font-sans, sans-serif)" }}>
        <div style={{ background: "#1e1b2e", padding: "16px" }}>
          <p className="font-medium text-white text-sm">ตั้งค่า</p>
          <p className="text-xs mt-0.5" style={{ color: "#6b6880", letterSpacing: "1px", textTransform: "uppercase" }}>Support Teambon · Admin</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#ebe9e1" }}>
            {[
              { icon: "🖥️", label: "เปิดหน้า Admin Desktop", action: () => window.open("/admin", "_blank") },
              { icon: "🔄", label: "รีโหลดข้อมูล", action: fetchJobs },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm border-b last:border-0"
                style={{ borderColor: "#ebe9e1", color: "#1e1b2e" }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                <span className="ml-auto" style={{ color: "#888780" }}>›</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("adminAuth"); setToken(null); }}
            className="w-full py-3 rounded-xl text-sm font-medium border"
            style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fff7f7" }}
          >
            ออกจากระบบ
          </button>
        </div>
        <BottomTab tab={tab} setTab={setTab} />
      </div>
    );
  }

  // ─── Home + Search Tab ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20" style={{ background: "#fafaf8", fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* Top Bar */}
      <div style={{ background: "#1e1b2e", padding: "16px" }} className="flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="font-medium text-white text-sm">Support Teambon</p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#6b6880", letterSpacing: "2px", textTransform: "uppercase" }}>VT Market · Admin</p>
        </div>
        <button onClick={fetchJobs} className="p-2 rounded-lg" style={{ background: "#2d2a3e" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#4f46e5", borderTopColor: "transparent" }} />
        </div>
      )}

      {fetchError && (
        <div className="mx-3 mt-3 rounded-xl border px-3 py-2.5" style={{ background: "#fff7f7", borderColor: "#fca5a5" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#dc2626" }}>⚠️ ดึงข้อมูลไม่ได้</p>
          <p className="text-xs break-all" style={{ color: "#b91c1c" }}>{fetchError}</p>
          <button onClick={fetchJobs} className="mt-2 text-xs font-medium" style={{ color: "#4f46e5" }}>🔄 ลองใหม่</button>
        </div>
      )}

      {!loading && tab === "home" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 p-3">
            {[
              { label: "ทั้งหมด",     val: stats.total,      color: "#1e1b2e", bar: "#a78bfa", pct: 100 },
              { label: "Done",        val: stats.done,       color: "#15803d", bar: "#4ade80", pct: stats.total ? Math.round(stats.done/stats.total*100) : 0 },
              { label: "In Progress", val: stats.inProgress, color: "#1d4ed8", bar: "#60a5fa", pct: stats.total ? Math.round(stats.inProgress/stats.total*100) : 0 },
              { label: "Overdue",     val: stats.overdue,    color: "#dc2626", bar: "#f87171", pct: stats.total ? Math.round(stats.overdue/stats.total*100) : 0 },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-3" style={{ borderColor: "#ebe9e1" }}>
                <p className="text-xs mb-1" style={{ color: "#888780", textTransform: "uppercase", letterSpacing: "0.8px" }}>{s.label}</p>
                <p className="text-2xl font-medium" style={{ color: s.color }}>{s.val}</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: "#f1f0ed" }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.bar }} />
                </div>
              </div>
            ))}
          </div>

          {/* Deadline warning */}
          {stats.dueTomorrow.length > 0 && (
            <div className="mx-3 mb-2 rounded-xl border px-3 py-2.5 flex items-start gap-2" style={{ background: "#fefce8", borderColor: "#fde68a" }}>
              <span className="text-sm mt-0.5">⏰</span>
              <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                <strong>ครบ deadline พรุ่งนี้:</strong>{" "}
                {stats.dueTomorrow.map(j => j.jobId).join(", ")}
              </p>
            </div>
          )}
        </>
      )}

      {/* Search Box */}
      <div className="mx-3 mb-2">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ background: "#fff", borderColor: "#ebe9e1" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#888780" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา Job ID, ลูกค้า, งาน..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "#1e1b2e" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "#888780" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-3 mb-3 overflow-x-auto pb-1">
        {([
          { key: "all",        label: "ทั้งหมด" },
          { key: "overdue",    label: "⚠️ Overdue" },
          { key: "revision",   label: "🔄 Revision" },
          { key: "inprogress", label: "🔵 กำลังทำ" },
          { key: "pending",    label: "⏳ Pending" },
        ] as { key: Filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium border transition flex-shrink-0"
            style={filter === f.key
              ? { background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" }
              : { background: "#fff", color: "#888780", borderColor: "#ebe9e1" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quick status change panel */}
      {selectedJob && (
        <div className="mx-3 mb-3 bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#ebe9e1" }}>
          <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "#ebe9e1", background: "#f1f0ed" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background: "#4f46e5" }} />
              <p className="text-xs font-medium" style={{ color: "#4f46e5", textTransform: "uppercase", letterSpacing: "1px" }}>
                {selectedJob.jobId}
              </p>
            </div>
            <button onClick={() => setSelectedJob(null)} style={{ color: "#888780" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18 18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="px-3 py-3 space-y-3">
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "#1e1b2e" }}>{selectedJob.task}</p>
              <p className="text-xs" style={{ color: "#888780" }}>{selectedJob.customerName} · {selectedJob.agent} · <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(selectedJob.status)}`}>{selectedJob.status}</span></p>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: "#888780", textTransform: "uppercase", letterSpacing: "0.8px" }}>เปลี่ยนสถานะ</p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_LIST.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={saving || selectedJob.status === s}
                    className={`py-2 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${statusBtn(s)}`}
                    style={selectedJob.status === s ? { opacity: 0.4 } : {}}
                  >
                    {selectedJob.status === s ? "✓ " : ""}{s}
                  </button>
                ))}
              </div>
              {savedIds.has(selectedJob.jobId + "_status") && (
                <p className="text-xs mt-1.5 text-center" style={{ color: "#15803d" }}>✓ บันทึกสถานะแล้ว</p>
              )}
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: "#888780", textTransform: "uppercase", letterSpacing: "0.8px" }}>Delivery Link</p>
              <div className="flex gap-2">
                <input
                  value={deliveryInput}
                  onChange={e => setDeliveryInput(e.target.value)}
                  placeholder="วาง link ที่นี่..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs border outline-none"
                  style={{ background: "#f1f0ed", borderColor: "#ebe9e1", color: "#1e1b2e" }}
                />
                <button
                  onClick={handleSaveDelivery}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "#4f46e5" }}
                >
                  บันทึก
                </button>
              </div>
              {savedIds.has(selectedJob.jobId + "_link") && (
                <p className="text-xs mt-1.5" style={{ color: "#15803d" }}>✓ บันทึก Link แล้ว</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-2 px-3 mb-2">
        <div className="w-0.5 h-3.5 rounded-full" style={{ background: "#a78bfa" }} />
        <p className="text-xs font-medium" style={{ color: "#888780", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          รายการงาน {filtered.length > 0 && `(${filtered.length})`}
        </p>
      </div>

      {/* Job list */}
      <div className="px-3 space-y-2">
        {filtered.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm" style={{ color: "#888780" }}>ไม่พบงานที่ตรงกัน</p>
          </div>
        )}
        {filtered.map(j => {
          const over = isOverdue(j.deadline, j.status);
          const tom = isDueTomorrow(j.deadline, j.status);
          const isSelected = selectedJob?.jobId === j.jobId;
          return (
            <button
              key={j.jobId}
              onClick={() => handleSelectJob(j)}
              className="w-full text-left rounded-xl border p-3 transition"
              style={{
                background: isSelected ? "#eef2ff" : over ? "#fff7f7" : j.status === "Approved" ? "#f0fdf4" : "#fff",
                borderColor: isSelected ? "#a5b4fc" : over ? "#fca5a5" : j.status === "Approved" ? "#bbf7d0" : "#ebe9e1",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {j.priority === "urgent" && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#f59e0b" }} />}
                  <span className="text-xs font-medium" style={{ color: "#4f46e5" }}>{j.jobId}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(j.status)}`}>{j.status}</span>
              </div>
              <p className="text-sm mb-1.5 leading-snug" style={{ color: "#1e1b2e" }}>{j.task}</p>
              <div className="flex items-center gap-3 text-xs" style={{ color: "#888780" }}>
                <span>👤 {j.customerName}</span>
                <span>🔧 {j.agent || "-"}</span>
              </div>
              {over && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#dc2626" }}>
                  ⚠️ เลย deadline แล้ว
                </p>
              )}
              {tom && !over && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#b45309" }}>
                  ⏰ ครบ deadline พรุ่งนี้
                </p>
              )}
            </button>
          );
        })}
      </div>

      <BottomTab tab={tab} setTab={setTab} />
    </div>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
function BottomTab({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "home", label: "หน้าหลัก", icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11 2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    )},
    { key: "search", label: "ค้นหา", icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>
    )},
    { key: "report", label: "รายงาน", icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
    )},
    { key: "settings", label: "ตั้งค่า", icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    )},
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t grid grid-cols-4" style={{ background: "#fff", borderColor: "#ebe9e1", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className="flex flex-col items-center gap-1 py-2.5 text-xs transition"
          style={{ color: tab === t.key ? "#4f46e5" : "#888780" }}
        >
          {t.icon}
          {tab === t.key
            ? <div className="w-1 h-1 rounded-full" style={{ background: "#4f46e5" }} />
            : <span>{t.label}</span>
          }
        </button>
      ))}
    </div>
  );
}
