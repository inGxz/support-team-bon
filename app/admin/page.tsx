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
  revisionNote: string;
  revisionCount: string;
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

// แปลง timestamp ไทย "27/5/2569, 13:26:32" → Date object (CE)
function parseThaiTimestamp(timestamp: string): Date | null {
  try {
    const clean = timestamp.replace(",", "").trim();
    const parts = clean.split(/[\s/]+/);
    const day   = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const yearCE = parseInt(parts[2]) - 543;
    return new Date(yearCE, month, day);
  } catch { return null; }
}

const MONTH_NAMES_TH = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

function formatDateTH(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${MONTH_NAMES_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch { return dateStr; }
}

function generateReportHTML(
  jobs: Job[],
  label: string,
  byWorkflow: { wf: string; total: number; pending: number; inProgress: number; done: number }[]
): string {
  const done       = jobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length;
  const inProgress = jobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length;
  const pending    = jobs.filter((j) => j.status === "Pending" || !j.status).length;
  const revision   = jobs.filter((j) => j.status === "Revision").length;

  const wfRows = byWorkflow.map((r) => `
    <tr>
      <td>${r.wf}</td>
      <td class="center bold">${r.total}</td>
      <td class="center amber">${r.pending}</td>
      <td class="center blue">${r.inProgress}</td>
      <td class="center green">${r.done}</td>
    </tr>
  `).join("");

  const jobRows = jobs.map((j, i) => `
    <tr class="${i % 2 === 0 ? "even" : ""}">
      <td class="bold purple">${j.jobId}</td>
      <td>${j.task || "-"}</td>
      <td>${j.subType || "-"}</td>
      <td>${formatDateTH(j.deadline)}</td>
      <td class="center"><span class="badge ${
        j.status === "Done" || j.status === "เสร็จแล้ว" ? "badge-done" :
        j.status === "In Progress" ? "badge-progress" :
        j.status === "Revision"    ? "badge-revision" : "badge-pending"
      }">${j.status || "Pending"}</span></td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<title>Report — SUPPORT TEAMBON ${label}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; background: #f8f9fa; color: #1f2937; font-size: 13px; }
  .page { max-width: 900px; margin: 0 auto; padding: 36px 40px; background: white; min-height: 100vh; }

  /* Header */
  .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #6d28d9 100%);
    border-radius: 16px; padding: 28px 32px; margin-bottom: 28px; color: white; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; }
  .brand-sub { font-size: 11px; letter-spacing: 4px; opacity: 0.7; margin-top: 2px; text-transform: uppercase; }
  .report-label { text-align: right; }
  .report-label .period { font-size: 18px; font-weight: 700; }
  .report-label .sub { font-size: 11px; opacity: 0.7; margin-top: 4px; }
  .header-divider { height: 1px; background: rgba(255,255,255,0.2); margin: 16px 0; }
  .header-stats { display: flex; gap: 24px; }
  .hstat { text-align: center; }
  .hstat-num { font-size: 28px; font-weight: 800; }
  .hstat-label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 1px; }

  /* Section */
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb;
    padding-bottom: 8px; margin-bottom: 14px; }

  /* Summary cards */
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border-radius: 12px; padding: 16px; text-align: center; border: 1px solid; }
  .card-total    { background: #f5f3ff; border-color: #ddd6fe; }
  .card-pending  { background: #fffbeb; border-color: #fde68a; }
  .card-progress { background: #eff6ff; border-color: #bfdbfe; }
  .card-done     { background: #f0fdf4; border-color: #bbf7d0; }
  .card-num  { font-size: 32px; font-weight: 800; }
  .card-label{ font-size: 11px; color: #6b7280; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .num-purple { color: #7c3aed; } .num-amber { color: #d97706; }
  .num-blue   { color: #2563eb; } .num-green  { color: #16a34a; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { background: #f3f4f6; text-align: left; padding: 10px 12px;
    font-weight: 700; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  tr.even td { background: #fafafa; }
  .center { text-align: center; }
  .bold   { font-weight: 700; }
  .purple { color: #7c3aed; }
  .green  { color: #16a34a; font-weight: 600; }
  .blue   { color: #2563eb; font-weight: 600; }
  .amber  { color: #d97706; font-weight: 600; }

  /* Badges */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; border: 1px solid; }
  .badge-done     { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
  .badge-progress { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
  .badge-pending  { background: #fef9c3; color: #92400e; border-color: #fde68a; }
  .badge-revision { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: 2px; text-transform: uppercase; }
  .footer-date  { font-size: 11px; color: #d1d5db; }

  @media print {
    body { background: white; }
    .page { padding: 20px 24px; }
    @page { margin: 16mm; size: A4; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-top">
      <div>
        <div class="brand">🚀 Support Teambon</div>
        <div class="brand-sub">VT Market — Job Report</div>
      </div>
      <div class="report-label">
        <div class="period">📊 ${label}</div>
        <div class="sub">สร้างเมื่อ ${new Date().toLocaleDateString("th-TH", { year:"numeric", month:"long", day:"numeric" })}</div>
      </div>
    </div>
    <div class="header-divider"></div>
    <div class="header-stats">
      <div class="hstat"><div class="hstat-num">${jobs.length}</div><div class="hstat-label">งานทั้งหมด</div></div>
      <div class="hstat"><div class="hstat-num">${done}</div><div class="hstat-label">Done</div></div>
      <div class="hstat"><div class="hstat-num">${inProgress}</div><div class="hstat-label">In Progress</div></div>
      <div class="hstat"><div class="hstat-num">${pending}</div><div class="hstat-label">Pending</div></div>
      ${revision > 0 ? `<div class="hstat"><div class="hstat-num">${revision}</div><div class="hstat-label">Revision</div></div>` : ""}
    </div>
  </div>

  <!-- Summary cards -->
  <div class="cards">
    <div class="card card-total">   <div class="card-num num-purple">${jobs.length}</div><div class="card-label">ทั้งหมด</div></div>
    <div class="card card-pending"> <div class="card-num num-amber">${pending}</div>   <div class="card-label">Pending</div></div>
    <div class="card card-progress"><div class="card-num num-blue">${inProgress}</div>  <div class="card-label">In Progress</div></div>
    <div class="card card-done">    <div class="card-num num-green">${done}</div>       <div class="card-label">Done</div></div>
  </div>

  <!-- Workflow breakdown -->
  <div class="section">
    <div class="section-title">📋 แยกตาม Workflow</div>
    <table>
      <thead>
        <tr><th>Workflow</th><th class="center">ทั้งหมด</th><th class="center">Pending</th><th class="center">In Progress</th><th class="center">Done</th></tr>
      </thead>
      <tbody>${wfRows}</tbody>
    </table>
  </div>

  <!-- Job list -->
  <div class="section">
    <div class="section-title">📄 รายการงานทั้งหมด (${jobs.length} งาน)</div>
    <table>
      <thead>
        <tr><th>Job ID</th><th>ประเภทงาน</th><th>ประเภทย่อย</th><th>Deadline</th><th class="center">สถานะ</th></tr>
      </thead>
      <tbody>${jobRows}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">Support Teambon VT Market</div>
    <div class="footer-date">พิมพ์เมื่อ ${new Date().toLocaleString("th-TH")}</div>
  </div>

</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
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
  if (status === "Revision") return "bg-red-50 border-red-300";
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

const STATUS_OPTS = ["Pending", "In Progress", "Done", "Revision"];

const statusStyle = (s: string) => {
  if (s === "Done" || s === "เสร็จแล้ว")
    return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" };
  if (s === "In Progress" || s === "กำลังทำ")
    return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", dot: "bg-blue-500" };
  if (s === "Revision")
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "bg-red-500" };
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
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const [filter, setFilter] = useState("ทั้งหมด");
  const [workflowFilter, setWorkflowFilter] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [activeTab, setActiveTab] = useState<"jobs" | "report">("jobs");
  const [reportMonth, setReportMonth] = useState<string>("");
  const [reportDateFrom, setReportDateFrom] = useState<string>("");
  const [reportDateTo, setReportDateTo] = useState<string>("");

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

  // กรองด้วย date range (ถ้ามี) หรือใช้ month selector
  const useDateRange = !!(reportDateFrom && reportDateTo);
  const reportJobs = useDateRange
    ? jobs.filter((j) => {
        const d = parseThaiTimestamp(j.timestamp);
        if (!d) return false;
        const from = new Date(reportDateFrom);
        const to   = new Date(reportDateTo);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      })
    : (monthJobsMap[selectedMonth] || []);

  const reportLabel = useDateRange
    ? `${formatDateTH(reportDateFrom)} – ${formatDateTH(reportDateTo)}`
    : selectedMonth;

  const reportByWorkflow = WORKFLOWS.map((wf) => {
    const wfJobs = reportJobs.filter((j) => getWorkflow(j.task) === wf);
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
                {/* Date range filter */}
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">🗓️ กรองช่วงวันที่</p>
                    {useDateRange && (
                      <button
                        onClick={() => { setReportDateFrom(""); setReportDateTo(""); }}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold transition"
                      >
                        ✕ ล้างค่า
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-xs text-gray-500 shrink-0">จาก</span>
                      <input
                        type="date"
                        value={reportDateFrom}
                        onChange={(e) => setReportDateFrom(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none text-gray-800"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="text-xs text-gray-500 shrink-0">ถึง</span>
                      <input
                        type="date"
                        value={reportDateTo}
                        onChange={(e) => setReportDateTo(e.target.value)}
                        className="flex-1 p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none text-gray-800"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const html = generateReportHTML(reportJobs, reportLabel, reportByWorkflow);
                        const win = window.open("", "_blank");
                        win?.document.write(html);
                        win?.document.close();
                      }}
                      className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold shadow hover:scale-[1.02] transition flex items-center gap-2"
                    >
                      📄 Export PDF
                    </button>
                  </div>
                  {!useDateRange && (
                    <p className="text-xs text-gray-400">หรือเลือกเดือนด้านล่าง — ถ้าเลือกช่วงวันที่จะใช้ช่วงวันที่แทน</p>
                  )}
                </div>

                {/* Month selector (ใช้เมื่อไม่ได้ set date range) */}
                {!useDateRange && (
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
                )}

                {/* Active filter label */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">แสดงผล:</span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                    {reportLabel} — {reportJobs.length} งาน
                  </span>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "งานทั้งหมด", count: reportJobs.length,                                                                              bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
                    { label: "Pending",     count: reportJobs.filter((j) => j.status === "Pending" || !j.status).length,                          bg: "bg-amber-50 border-amber-200",   text: "text-amber-700"  },
                    { label: "In Progress", count: reportJobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length,          bg: "bg-blue-50 border-blue-200",     text: "text-blue-700"   },
                    { label: "Done",        count: reportJobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length,               bg: "bg-green-50 border-green-200",   text: "text-green-700"  },
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
                    <p className="text-gray-400">ไม่มีงานในช่วงที่เลือก</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportByWorkflow.map(({ wf, total, pending, inProgress, done, jobs: wfJobs }) => {
                      const ws = WF_STYLE[wf];
                      const donePct = total ? Math.round((done / total) * 100) : 0;
                      return (
                        <div key={wf} className={`${ws.bg} border ${ws.border} rounded-xl overflow-hidden`}>
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
                          <div className="px-5 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                                <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${donePct}%` }} />
                              </div>
                              <span className="text-xs font-bold text-green-600 w-12 text-right">{donePct}% Done</span>
                            </div>
                          </div>
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
                                    {isOverdue(j.deadline, j.status) && <span className="text-xs font-bold text-red-600">⚠️</span>}
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

                        {/* Revision info */}
                        {job.revisionNote && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <span className="text-red-500 text-sm shrink-0 mt-0.5">🔄</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-bold text-red-700">ขอแก้ไขงาน</p>
                                {parseInt(job.revisionCount || "0") > 0 && (
                                  <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">
                                    ครั้งที่ {job.revisionCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-red-800 whitespace-pre-wrap">{job.revisionNote}</p>
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
                              <div key={idx} className="border-b border-purple-50 last:border-0">
                                <img src={url.trim()} alt={`รูปที่ ${idx + 1}`}
                                  className="w-full max-h-56 object-contain bg-gray-50 cursor-pointer"
                                  onClick={() => window.open(url.trim(), "_blank")} />
                                <div className="flex items-center justify-between px-3 py-1.5 bg-white">
                                  <span className="text-xs font-medium text-gray-800">รูปที่ {idx + 1}</span>
                                  <a href={url.trim()} target="_blank" rel="noopener noreferrer"
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow transition">
                                    ↗ เปิดใน Drive
                                  </a>
                                </div>
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
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/brief?jobId=${job.jobId}`;
                              navigator.clipboard.writeText(url);
                              setCopiedMap((p) => ({ ...p, [job.jobId]: true }));
                              setTimeout(() => setCopiedMap((p) => ({ ...p, [job.jobId]: false })), 2500);
                            }}
                            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition border ${
                              copiedMap[job.jobId]
                                ? "bg-teal-500 text-white border-teal-500"
                                : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                            }`}
                          >
                            {copiedMap[job.jobId] ? "✅ คัดลอกแล้ว!" : "🔗 แชร์ฟรีแลน"}
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
