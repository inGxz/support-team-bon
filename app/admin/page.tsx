"use client";

import { useState, useEffect, useCallback } from "react";

type Job = {
  jobId: string;
  customerName: string;
  agent: string;
  task: string;
  subType: string;
  workflowParams: string;
  reference: string;
  detail: string;
  deadline: string;
  status: string;
  lineUserId: string;
  deliveryLink: string;
  imageUrl: string;
  timestamp: string;
};

type EditState = { status: string; deliveryLink: string };

// แปลง timestamp ไทย "26/5/2569 22:35:56" → "พ.ค. 2026"
function parseMonthYear(timestamp: string): string {
  try {
    const parts = timestamp.split("/");
    if (parts.length >= 3) {
      const month = parseInt(parts[1]);
      const yearCE = parseInt(parts[2]) - 543;
      const monthNames = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      return `${monthNames[month - 1] ?? "?"} ${yearCE}`;
    }
  } catch {}
  return "ไม่ระบุ";
}

function getWorkflow(task: string): string {
  const t = (task || "").toLowerCase();
  if (t.includes("video")) return "Video";
  if (t.includes("design")) return "Design";
  if (t.includes("ads")) return "Ads";
  if (t.includes("content")) return "Content";
  if (t.includes("filming") || t.includes("film")) return "Filming";
  return "อื่นๆ";
}

function isOverdue(deadline: string, status: string): boolean {
  if (status === "Done" || status === "เสร็จแล้ว") return false;
  if (!deadline) return false;
  try {
    return new Date(deadline) < new Date();
  } catch { return false; }
}

function cardBg(status: string, overdue: boolean): string {
  if (overdue) return "bg-red-50 border-red-300";
  if (status === "Done" || status === "เสร็จแล้ว") return "bg-green-50 border-green-200";
  if (status === "In Progress" || status === "กำลังทำ") return "bg-blue-50 border-blue-200";
  return "bg-white border-gray-100";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_OPTS = ["Pending", "In Progress", "Done"];

const statusStyle = (s: string) => {
  if (s === "Done" || s === "เสร็จแล้ว")
    return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" };
  if (s === "In Progress" || s === "กำลังทำ")
    return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", dot: "bg-blue-500" };
  return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-400" };
};

const WORKFLOWS = ["Video", "Design", "Ads", "Content", "Filming", "อื่นๆ"];
const WF_STYLE: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Video:   { bg: "bg-pink-50",   text: "text-pink-700",   border: "border-pink-200",   icon: "🎬" },
  Design:  { bg: "bg-cyan-50",   text: "text-cyan-700",   border: "border-cyan-200",   icon: "🎨" },
  Ads:     { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: "📢" },
  Content: { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",icon: "✍️" },
  Filming: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: "🎥" },
  "อื่นๆ":{ bg: "bg-gray-50",  text: "text-gray-600",   border: "border-gray-200",   icon: "📁" },
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [editState, setEditState] = useState<Record<string, EditState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const [filter, setFilter] = useState("ทั้งหมด");
  const [workflowFilter, setWorkflowFilter] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [activeTab, setActiveTab] = useState<"jobs" | "report">("jobs");
  const [reportMonth, setReportMonth] = useState<string>("");

  useEffect(() => {
    const s = sessionStorage.getItem("adminAuth");
    if (s) setIsLoggedIn(true);
  }, []);

  const fetchJobs = useCallback(async (silent = false) => {
    const token = sessionStorage.getItem("adminAuth") || "";
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
        setEditState((prev) => {
          const next: Record<string, EditState> = {};
          data.jobs.forEach((j: Job) => {
            next[j.jobId] = prev[j.jobId] ?? { status: j.status || "Pending", deliveryLink: j.deliveryLink || "" };
          });
          return next;
        });
        setLastUpdated(new Date());
        setCountdown(30);
      }
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchJobs();
  }, [isLoggedIn, fetchJobs]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => fetchJobs(true), 30000);
    const tick = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [isLoggedIn, fetchJobs]);

  const handleLogin = async () => {
    if (!password) return;
    setAuthLoading(true);
    setPwError(false);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("adminAuth", password);
        setIsLoggedIn(true);
      } else {
        setPwError(true);
      }
    } catch {
      setPwError(true);
    }
    setAuthLoading(false);
  };

  const handleSave = async (jobId: string) => {
    const edit = editState[jobId];
    if (!edit) return;
    const token = sessionStorage.getItem("adminAuth") || "";
    setSaving((p) => ({ ...p, [jobId]: true }));
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId, status: edit.status, deliveryLink: edit.deliveryLink }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((p) => p.map((j) => j.jobId === jobId ? { ...j, status: edit.status, deliveryLink: edit.deliveryLink } : j));
        setSavedMap((p) => ({ ...p, [jobId]: true }));
        setTimeout(() => setSavedMap((p) => ({ ...p, [jobId]: false })), 2500);
      }
    } catch {}
    setSaving((p) => ({ ...p, [jobId]: false }));
  };

  const isDirty = (jobId: string) => {
    const job = jobs.find((j) => j.jobId === jobId);
    const edit = editState[jobId];
    if (!job || !edit) return false;
    return edit.status !== (job.status || "Pending") || edit.deliveryLink !== (job.deliveryLink || "");
  };

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "Pending" || !j.status).length,
    inProgress: jobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length,
    done: jobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length,
  };

  const workflowCount: Record<string, number> = {};
  jobs.forEach((j) => {
    const wf = getWorkflow(j.task);
    workflowCount[wf] = (workflowCount[wf] || 0) + 1;
  });

  const monthlyCount: Record<string, number> = {};
  jobs.forEach((j) => {
    const m = parseMonthYear(j.timestamp);
    monthlyCount[m] = (monthlyCount[m] || 0) + 1;
  });
  const monthlyEntries = Object.entries(monthlyCount).slice(-6).reverse();

  const filtered = jobs.filter((j) => {
    const matchStatus =
      filter === "ทั้งหมด" ||
      (filter === "Pending" && (j.status === "Pending" || !j.status)) ||
      (filter === "In Progress" && (j.status === "In Progress" || j.status === "กำลังทำ")) ||
      (filter === "Done" && (j.status === "Done" || j.status === "เสร็จแล้ว")) ||
      (filter === "Overdue" && isOverdue(j.deadline, j.status));
    const matchWorkflow = workflowFilter === "ทั้งหมด" || getWorkflow(j.task) === workflowFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.jobId.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q) || j.agent.toLowerCase().includes(q);
    return matchStatus && matchWorkflow && matchSearch;
  });

  const overdueCount = jobs.filter((j) => isOverdue(j.deadline, j.status)).length;

  const exportCSV = () => {
    const headers = ["Job ID", "ลูกค้า", "เซลล์", "ประเภทงาน", "Deadline", "สถานะ", "Delivery Link", "วันที่สั่ง"];
    const rows = filtered.map((j) => [j.jobId, j.customerName, j.agent, j.task, formatDate(j.deadline), j.status, j.deliveryLink, j.timestamp]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teambon-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── REPORT DATA ─────────────────────────────────────────────────────────────
  const monthJobsMap: Record<string, Job[]> = {};
  jobs.forEach((j) => {
    const m = parseMonthYear(j.timestamp);
    if (!monthJobsMap[m]) monthJobsMap[m] = [];
    monthJobsMap[m].push(j);
  });
  const allMonths = Object.keys(monthJobsMap).slice(0, 12);
  const selectedMonth = reportMonth || allMonths[0] || "";
  const monthJobs = monthJobsMap[selectedMonth] || [];

  const reportByWorkflow = WORKFLOWS.map((wf) => {
    const wfJobs = monthJobs.filter((j) => getWorkflow(j.task) === wf);
    const pending    = wfJobs.filter((j) => j.status === "Pending" || !j.status).length;
    const inProgress = wfJobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length;
    const done       = wfJobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length;
    return { wf, total: wfJobs.length, pending, inProgress, done, jobs: wfJobs };
  }).filter((r) => r.total > 0);

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="px-8 py-8 space-y-5 text-center">
            <div className="text-5xl">🛠️</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-400 text-sm mt-1">SUPPORT TEAMBON VT MARKET</p>
            </div>
            <input
              type="password"
              placeholder="รหัสผ่าน Admin"
              className={`w-full p-3 rounded-xl border ${pwError ? "border-red-400 ring-2 ring-red-200" : "border-gray-200"} focus:ring-2 focus:ring-purple-300 outline-none text-center text-gray-800`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            {pwError && <p className="text-red-400 text-sm">รหัสผ่านไม่ถูกต้อง</p>}
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-bold hover:scale-[1.02] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {authLoading ? <><span className="animate-spin">⏳</span> กำลังตรวจสอบ...</> : "เข้าสู่ระบบ"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-100">

      {/* Top bar */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
        <div>
          <h1 className="text-white font-black text-lg tracking-widest">🛠️ ADMIN PANEL</h1>
          <p className="text-purple-200 text-xs">SUPPORT TEAMBON VT MARKET</p>
        </div>
        <div className="flex gap-2 items-center">
          {lastUpdated && (
            <div className="text-right hidden sm:block">
              <p className="text-purple-200 text-xs">อัปเดตล่าสุด {lastUpdated.toLocaleTimeString("th-TH")}</p>
              <p className="text-purple-300 text-xs">รีเฟรชใน {countdown} วิ</p>
            </div>
          )}
          <button onClick={exportCSV} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
            📥 Export CSV
          </button>
          <button onClick={() => fetchJobs()} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh
          </button>
          <button
            onClick={() => { sessionStorage.removeItem("adminAuth"); setIsLoggedIn(false); setPassword(""); }}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pt-2">
          {(["jobs", "report"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition border-b-2 ${
                activeTab === key
                  ? "border-purple-500 text-purple-700 bg-purple-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {key === "jobs" ? "📋 รายการงาน" : "📊 รีพอร์ตรายเดือน"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* ══════════════════════ REPORT TAB ══════════════════════ */}
        {activeTab === "report" && (
          <div className="space-y-4">
            {allMonths.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-400">ยังไม่มีข้อมูลงาน</p>
              </div>
            ) : (
              <>
                {/* Month selector */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">เลือกเดือน</p>
                  <div className="flex flex-wrap gap-2">
                    {allMonths.map((m) => (
                      <button
                        key={m}
                        onClick={() => setReportMonth(m)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                          selectedMonth === m
                            ? "bg-purple-500 text-white border-purple-500 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600"
                        }`}
                      >
                        {m}
                        <span className={`ml-1.5 text-xs font-normal ${selectedMonth === m ? "text-purple-200" : "text-gray-400"}`}>
                          ({monthJobsMap[m].length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "งานทั้งหมด", count: monthJobs.length,                                                                              bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
                    { label: "Pending",     count: monthJobs.filter((j) => j.status === "Pending" || !j.status).length,                          bg: "bg-amber-50 border-amber-200",   text: "text-amber-700"  },
                    { label: "In Progress", count: monthJobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length,          bg: "bg-blue-50 border-blue-200",     text: "text-blue-700"   },
                    { label: "Done",        count: monthJobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length,               bg: "bg-green-50 border-green-200",   text: "text-green-700"  },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} border rounded-xl p-4 text-center`}>
                      <p className={`text-3xl font-black ${s.text}`}>{s.count}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Per-workflow breakdown */}
                {reportByWorkflow.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <p className="text-gray-400">ไม่มีงานในเดือนนี้</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportByWorkflow.map(({ wf, total, pending, inProgress, done, jobs: wfJobs }) => {
                      const ws = WF_STYLE[wf];
                      const donePct = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <div key={wf} className={`${ws.bg} border ${ws.border} rounded-xl overflow-hidden`}>
                          {/* Workflow header */}
                          <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ws.icon}</span>
                              <span className={`font-black text-base ${ws.text}`}>{wf}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 ${ws.text}`}>{total} งาน</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                              {pending > 0    && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⏳ {pending} Pending</span>}
                              {inProgress > 0 && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">🔧 {inProgress} In Progress</span>}
                              {done > 0       && <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">✅ {done} Done</span>}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="px-5 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                                <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${donePct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-green-600 w-12 text-right">{donePct}% Done</span>
                            </div>
                          </div>

                          {/* Job rows */}
                          <div className="border-t border-white/40 divide-y divide-white/30">
                            {wfJobs.map((j) => {
                              const jSt = statusStyle(j.status || "Pending");
                              return (
                                <div key={j.jobId} className="px-5 py-2.5 flex items-center justify-between gap-3 bg-white/30">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="font-bold text-purple-700 text-sm shrink-0">{j.jobId}</span>
                                    <span className="text-sm text-gray-700 truncate">{j.customerName || "-"}</span>
                                    <span className="text-xs text-gray-500 truncate hidden sm:block">{j.task}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isOverdue(j.deadline, j.status) && (
                                      <span className="text-xs font-bold text-red-600">⚠️</span>
                                    )}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${jSt.bg} ${jSt.text} ${jSt.border}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${jSt.dot}`} />
                                      {j.status || "Pending"}
                                    </span>
                                    <span className="text-xs text-gray-400 hidden sm:block">{formatDate(j.deadline)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ JOBS TAB ══════════════════════ */}
        {activeTab === "jobs" && (
          <div className="space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "ทั้งหมด",    count: stats.total,      bg: "bg-white border-gray-200",       text: "text-gray-700"  },
                { label: "Pending",    count: stats.pending,    bg: "bg-amber-50 border-amber-200",   text: "text-amber-700" },
                { label: "In Progress",count: stats.inProgress, bg: "bg-blue-50 border-blue-200",     text: "text-blue-700"  },
                { label: "Done",       count: stats.done,       bg: "bg-green-50 border-green-200",   text: "text-green-700" },
                { label: "Overdue",    count: overdueCount,     bg: "bg-red-50 border-red-200",        text: "text-red-700"   },
              ].map((s) => (
                <div
                  key={s.label}
                  onClick={() => setFilter(s.label)}
                  className={`${s.bg} border rounded-xl p-3 text-center cursor-pointer hover:shadow-sm transition ${filter === s.label ? "ring-2 ring-purple-400" : ""}`}
                >
                  <p className={`text-2xl font-black ${s.text}`}>{s.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Workflow + Monthly breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📊 แยกตาม Workflow</p>
                <div className="space-y-2">
                  {[
                    { label: "🎬 Video",  color: "bg-pink-500",    key: "Video"   },
                    { label: "🎨 Design", color: "bg-cyan-500",    key: "Design"  },
                    { label: "📢 Ads",    color: "bg-orange-500",  key: "Ads"     },
                    { label: "✍️ Content",color: "bg-emerald-500", key: "Content" },
                    { label: "🎥 Filming",color: "bg-violet-500",  key: "Filming" },
                    { label: "อื่นๆ",    color: "bg-gray-400",    key: "อื่นๆ"   },
                  ].map(({ label, color, key }) => {
                    const count = workflowCount[key] || 0;
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{label}</span>
                          <span className="font-bold text-gray-800">{count} งาน</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📅 ยอดสั่งงานรายเดือน</p>
                {monthlyEntries.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">ไม่มีข้อมูล</p>
                ) : (
                  <div className="space-y-2">
                    {monthlyEntries.map(([month, count]) => {
                      const max = Math.max(...monthlyEntries.map(([, c]) => c));
                      const pct = max ? Math.round((count / max) * 100) : 0;
                      return (
                        <div key={month}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">{month}</span>
                            <span className="font-bold text-gray-800">{count} งาน</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Search + Filter */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <input
                placeholder="🔍 ค้นหา Job ID / ลูกค้า / เซลล์"
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none text-gray-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-gray-400 font-medium">Workflow:</span>
                {[
                  { label: "ทั้งหมด", color: "",     icon: ""   },
                  { label: "Video",   color: "text-pink-600 border-pink-200 bg-pink-50",        icon: "🎬" },
                  { label: "Design",  color: "text-cyan-600 border-cyan-200 bg-cyan-50",         icon: "🎨" },
                  { label: "Ads",     color: "text-orange-600 border-orange-200 bg-orange-50",   icon: "📢" },
                  { label: "Content", color: "text-emerald-600 border-emerald-200 bg-emerald-50",icon: "✍️" },
                  { label: "Filming", color: "text-violet-600 border-violet-200 bg-violet-50",   icon: "🎥" },
                  { label: "อื่นๆ",  color: "text-gray-600 border-gray-200 bg-gray-50",         icon: ""   },
                ].map(({ label, color, icon }) => (
                  <button
                    key={label}
                    onClick={() => setWorkflowFilter(label)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                      workflowFilter === label
                        ? "bg-purple-500 text-white border-purple-500"
                        : color || "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {icon} {label}
                    {label !== "ทั้งหมด" && <span className="ml-1 opacity-70">({workflowCount[label] || 0})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Job list */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-400">ไม่มีงานในหมวดนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((job) => {
                  const edit = editState[job.jobId] || { status: job.status, deliveryLink: job.deliveryLink || "" };
                  const st = statusStyle(edit.status);
                  const dirty = isDirty(job.jobId);
                  const isSaving = saving[job.jobId];
                  const isSaved = savedMap[job.jobId];
                  const overdue = isOverdue(job.deadline, edit.status);

                  return (
                    <div key={job.jobId} className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${cardBg(edit.status, overdue)}`}>
                      {/* Card header */}
                      <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-black text-purple-600">{job.jobId}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${st.bg} ${st.text} ${st.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {job.status || "Pending"}
                          </span>
                          {overdue && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600 border border-red-300">⚠️ Overdue</span>
                          )}
                          {job.lineUserId && (
                            <span className="text-xs text-green-500 font-semibold">💬 LINE</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{job.timestamp}</span>
                      </div>

                      {/* Card body */}
                      <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex gap-2">
                            <span className="text-gray-400 shrink-0">👤</span>
                            <span className="font-medium text-gray-800">{job.customerName || "-"}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-400 shrink-0">🧑‍💼</span>
                            <span className="font-medium text-gray-800">{job.agent || "-"}</span>
                          </div>
                          <div className="flex gap-2 col-span-2">
                            <span className="text-gray-400 shrink-0">📅</span>
                            <span className="font-medium text-gray-800">{formatDate(job.deadline)}</span>
                          </div>
                        </div>

                        {/* Workflow badge */}
                        {job.task && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium">ประเภทงาน:</span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                              getWorkflow(job.task) === "Video"  ? "bg-pink-50 text-pink-700 border-pink-200"     :
                              getWorkflow(job.task) === "Design" ? "bg-cyan-50 text-cyan-700 border-cyan-200"     :
                              getWorkflow(job.task) === "Ads"    ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                   "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {getWorkflow(job.task) === "Video"  ? "🎬" :
                               getWorkflow(job.task) === "Design" ? "🎨" :
                               getWorkflow(job.task) === "Ads"    ? "📢" : "📁"} {job.task}
                            </span>
                          </div>
                        )}

                        {/* Sub-type */}
                        {job.subType && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-medium shrink-0">ประเภทย่อย:</span>
                            <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">{job.subType}</span>
                          </div>
                        )}

                        {/* Workflow params (Video: Platform/Goal/Mood etc.) */}
                        {job.workflowParams && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.workflowParams.split("|").map((p) => p.trim()).filter(Boolean).map((p) => (
                              <span key={p} className="text-xs bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{p}</span>
                            ))}
                          </div>
                        )}

                        {/* Detail */}
                        {job.detail && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <p className="text-xs font-bold text-blue-500 mb-1">📝 รายละเอียดงาน</p>
                            <p className="text-xs text-blue-800 whitespace-pre-wrap">{job.detail}</p>
                          </div>
                        )}

                        {/* Reference link */}
                        {job.reference && (
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <span className="text-amber-500 text-sm shrink-0 mt-0.5">🔗</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-amber-700 mb-0.5">ลิ้งอ้างอิงจากลูกค้า</p>
                              {job.reference.startsWith("http") ? (
                                <a href={job.reference} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all hover:text-blue-800">
                                  {job.reference}
                                </a>
                              ) : (
                                <p className="text-xs text-amber-800 break-all">{job.reference}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Customer image attachments (comma-separated URLs) */}
                        {job.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-purple-100 shadow-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border-b border-purple-100">
                              <span className="text-purple-500 text-sm">🖼️</span>
                              <p className="text-xs font-bold text-purple-700">รูปจากลูกค้า ({job.imageUrl.split(",").filter(Boolean).length} รูป)</p>
                            </div>
                            {job.imageUrl.split(",").filter(Boolean).map((url, idx) => (
                              <div key={idx} className="relative border-b border-purple-50 last:border-0">
                                <img src={url.trim()} alt={`attachment ${idx + 1}`}
                                  className="w-full max-h-56 object-contain bg-gray-50 cursor-pointer"
                                  onClick={() => window.open(url.trim(), "_blank")} />
                                <a href={url.trim()} target="_blank" rel="noopener noreferrer"
                                  className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow transition">
                                  ↗ เปิดใน Drive
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Edit controls */}
                        <div className="flex gap-2 items-end flex-wrap pt-1 border-t border-gray-50">
                          <div className="w-36 shrink-0">
                            <p className="text-xs text-gray-400 mb-1 font-medium">สถานะ</p>
                            <select
                              className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none text-gray-800 bg-white"
                              value={edit.status || "Pending"}
                              onChange={(e) => setEditState((p) => ({ ...p, [job.jobId]: { ...edit, status: e.target.value } }))}
                            >
                              {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="flex-1 min-w-[180px]">
                            <p className="text-xs text-gray-400 mb-1 font-medium">📂 Delivery Link</p>
                            <input
                              className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none text-gray-800"
                              placeholder="https://drive.google.com/..."
                              value={edit.deliveryLink}
                              onChange={(e) => setEditState((p) => ({ ...p, [job.jobId]: { ...edit, deliveryLink: e.target.value } }))}
                            />
                          </div>
                          <button
                            disabled={!dirty || isSaving}
                            onClick={() => handleSave(job.jobId)}
                            className={`shrink-0 px-5 py-2 rounded-lg text-sm font-bold transition ${
                              isSaved ? "bg-green-500 text-white" :
                              dirty   ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-[1.02] shadow-md" :
                                        "bg-gray-100 text-gray-400 cursor-not-allowed"
                            } disabled:opacity-60`}
                          >
                            {isSaving ? "⏳" : isSaved ? "✅ บันทึกแล้ว" : "💾 บันทึก"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}
