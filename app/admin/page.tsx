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
  priority: string;
  internalNote: string;
};

type EditState = { status: string; deliveryLink: string; internalNote: string };

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
  const total      = jobs.length;
  const done       = jobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length;
  const inProgress = jobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length;
  const pending    = jobs.filter((j) => j.status === "Pending" || !j.status).length;
  const revision   = jobs.filter((j) => j.status === "Revision").length;
  const overdue    = jobs.filter((j) => isOverdue(j.deadline, j.status)).length;
  const revisedJobs = jobs.filter((j) => parseInt(j.revisionCount || "0") > 0).length;
  const completionRate = total ? Math.round((done / total) * 100) : 0;
  const revisionRate   = total ? Math.round((revisedJobs / total) * 100) : 0;

  // Avg turnaround: mean (deadline − orderDate) for Done jobs
  const doneJobs = jobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว");
  let avgDays = 0;
  if (doneJobs.length > 0) {
    const totalDays = doneJobs.reduce((sum, j) => {
      const od = parseThaiTimestamp(j.timestamp);
      if (!od || !j.deadline) return sum;
      const diff = Math.ceil((new Date(j.deadline).getTime() - od.getTime()) / 86400000);
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    avgDays = Math.round((totalDays / doneJobs.length) * 10) / 10;
  }

  // Donut chart (r=36, circ≈226.2, start at 12 o'clock = offset +56.55)
  const circ = 226.2;
  const startOff = circ / 4;
  const seg = (len: number, color: string, off: number) =>
    `<circle cx="48" cy="48" r="36" fill="none" stroke="${color}" stroke-width="10" stroke-dasharray="${len.toFixed(1)} ${(circ - len).toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>`;
  const dL = total ? (done / total) * circ : 0;
  const pL = total ? (inProgress / total) * circ : 0;
  const ndL = total ? (pending / total) * circ : 0;
  const rL = total ? (revision / total) * circ : 0;
  const donutSVG = [
    seg(dL,  "#4ade80", startOff),
    seg(pL,  "#60a5fa", startOff - dL),
    seg(ndL, "#fbbf24", startOff - dL - pL),
    seg(rL,  "#f87171", startOff - dL - pL - ndL),
  ].join("");

  // Bar chart
  const maxWf = Math.max(...byWorkflow.map((r) => r.total), 1);
  const wfIcon = (wf: string) =>
    wf === "Video" ? "🎬" : wf === "Design" ? "🎨" : wf === "Ads" ? "📢" : wf === "Content" ? "✍️" : wf === "Filming" ? "🎥" : "📁";

  const wfBarRows = byWorkflow.map((r) => `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;color:#444441">${wfIcon(r.wf)} ${r.wf}</span>
        <span style="font-size:12px;font-weight:500;color:#1e1b2e">${r.total}</span>
      </div>
      <div style="height:6px;background:#f1f0ed;border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.round((r.total / maxWf) * 100)}%;background:#a78bfa;border-radius:3px"></div>
      </div>
    </div>`).join("");

  const wfTableRows = byWorkflow.map((r, i) => {
    const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
    const pctStyle = pct >= 60
      ? "background:#dcfce7;color:#15803d"
      : pct >= 30 ? "background:#fef9c3;color:#92400e"
      : "background:#fee2e2;color:#b91c1c";
    return `<tr style="${i % 2 === 1 ? "background:#fafaf8;" : ""}border-bottom:0.5px solid #ebe9e1">
      <td style="padding:9px 10px;font-weight:500;color:#1e1b2e">${wfIcon(r.wf)} ${r.wf}</td>
      <td style="padding:9px 10px;text-align:center;font-weight:500;color:#1e1b2e">${r.total}</td>
      <td style="padding:9px 10px;text-align:center;color:#15803d;font-weight:500">${r.done}</td>
      <td style="padding:9px 10px;text-align:center;color:#1d4ed8">${r.inProgress}</td>
      <td style="padding:9px 10px;text-align:center;color:#b45309">${r.pending}</td>
      <td style="padding:9px 10px;text-align:center"><span style="${pctStyle};border-radius:999px;padding:2px 8px;font-size:10px;font-weight:500">${pct}%</span></td>
    </tr>`;
  }).join("");

  // subType breakdown (across all workflows)
  const subTypeMap: Record<string, { total: number; done: number; inProgress: number; pending: number; wf: string }> = {};
  jobs.forEach((j) => {
    const st = j.subType || "—";
    const wf = getWorkflow(j.task);
    if (!subTypeMap[st]) subTypeMap[st] = { total: 0, done: 0, inProgress: 0, pending: 0, wf };
    subTypeMap[st].total++;
    if (j.status === "Done" || j.status === "เสร็จแล้ว")         subTypeMap[st].done++;
    else if (j.status === "In Progress" || j.status === "กำลังทำ") subTypeMap[st].inProgress++;
    else                                                            subTypeMap[st].pending++;
  });
  const subTypeRows = Object.entries(subTypeMap)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([st, v], i) => {
      const pct = v.total ? Math.round((v.done / v.total) * 100) : 0;
      const pctStyle = pct >= 60 ? "background:#dcfce7;color:#15803d" : pct >= 30 ? "background:#fef9c3;color:#92400e" : "background:#fee2e2;color:#b91c1c";
      return `<tr style="${i % 2 === 1 ? "background:#fafaf8;" : ""}border-bottom:0.5px solid #ebe9e1">
        <td style="padding:8px 10px;font-weight:500;color:#1e1b2e">${st}</td>
        <td style="padding:8px 10px;color:#888780;font-size:11px">${wfIcon(v.wf)} ${v.wf}</td>
        <td style="padding:8px 10px;text-align:center;font-weight:500;color:#1e1b2e">${v.total}</td>
        <td style="padding:8px 10px;text-align:center;color:#15803d;font-weight:500">${v.done}</td>
        <td style="padding:8px 10px;text-align:center;color:#1d4ed8">${v.inProgress}</td>
        <td style="padding:8px 10px;text-align:center;color:#b45309">${v.pending}</td>
        <td style="padding:8px 10px;text-align:center"><span style="${pctStyle};border-radius:999px;padding:2px 8px;font-size:10px;font-weight:500">${pct}%</span></td>
      </tr>`;
    }).join("");

  const jobRows = jobs.map((j, i) => {
    const ss =
      j.status === "Done" || j.status === "เสร็จแล้ว" ? "background:#dcfce7;color:#15803d" :
      j.status === "In Progress" || j.status === "กำลังทำ" ? "background:#dbeafe;color:#1d4ed8" :
      j.status === "Revision" ? "background:#fee2e2;color:#b91c1c" : "background:#fef9c3;color:#92400e";
    const od = isOverdue(j.deadline, j.status);
    const rev = parseInt(j.revisionCount || "0");
    return `<tr style="${i % 2 === 1 ? "background:#fafaf8;" : ""}border-bottom:0.5px solid #ebe9e1">
      <td style="padding:8px 10px;font-weight:500;color:#4f46e5">${j.jobId}</td>
      <td style="padding:8px 10px;color:#444441">${j.task || "-"} <span style="color:#888780">/ ${j.subType || "-"}</span></td>
      <td style="padding:8px 10px;${od ? "color:#dc2626;font-weight:500" : "color:#888780"}">${od ? "⚠ " : ""}${formatDateTH(j.deadline)}</td>
      <td style="padding:8px 10px;text-align:center"><span style="${ss};border-radius:999px;padding:2px 8px;font-size:10px;font-weight:500">${j.status || "Pending"}</span></td>
      <td style="padding:8px 10px;text-align:right;color:#888780;font-size:11px">${rev} ครั้ง</td>
    </tr>`;
  }).join("");

  const printDate = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<title>Report — SUPPORT TEAMBON ${label}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Sarabun',sans-serif; background:#f1f0ed; color:#1f2937; }
  .page { max-width:860px; margin:0 auto; background:white; }
  @media print {
    body { background:white; }
    .page { max-width:100%; }
    @page { margin:12mm; size:A4; }
  }
</style>
</head>
<body>
<div class="page">

<div style="background:#1e1b2e;padding:28px 32px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <div>
      <div style="font-size:10px;letter-spacing:4px;color:#6b6880;text-transform:uppercase;margin-bottom:6px">Monthly Report</div>
      <div style="font-size:20px;font-weight:500;color:#fff;letter-spacing:0.5px">Support Teambon</div>
      <div style="font-size:11px;color:#6b6880;letter-spacing:2px;text-transform:uppercase;margin-top:3px">VT Market</div>
    </div>
    <div style="background:#2d2a3e;border-radius:10px;padding:10px 16px;text-align:right">
      <div style="font-size:16px;font-weight:500;color:#c4b5fd">${label}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px">สร้างเมื่อ ${printDate}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#2d2a3e;border-radius:10px;overflow:hidden">
    <div style="background:#1e1b2e;padding:14px 12px;text-align:center">
      <div style="font-size:22px;font-weight:500;color:#fff">${total}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">ทั้งหมด</div>
    </div>
    <div style="background:#1e1b2e;padding:14px 12px;text-align:center">
      <div style="font-size:22px;font-weight:500;color:#4ade80">${done}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">Done</div>
    </div>
    <div style="background:#1e1b2e;padding:14px 12px;text-align:center">
      <div style="font-size:22px;font-weight:500;color:#60a5fa">${inProgress}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">In Progress</div>
    </div>
    <div style="background:#1e1b2e;padding:14px 12px;text-align:center">
      <div style="font-size:22px;font-weight:500;color:#fbbf24">${pending}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">Pending</div>
    </div>
    <div style="background:#1e1b2e;padding:14px 12px;text-align:center">
      <div style="font-size:22px;font-weight:500;color:#f87171">${revision}</div>
      <div style="font-size:10px;color:#6b6880;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px">Revision</div>
    </div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:0.5px solid #ebe9e1">
  <div style="padding:24px;border-right:0.5px solid #ebe9e1">
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1.5px;color:#888780;margin-bottom:16px">สัดส่วนสถานะ</div>
    <div style="display:flex;align-items:center;gap:20px">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="36" fill="none" stroke="#f1f0ed" stroke-width="10"/>
        ${donutSVG}
        <text x="48" y="44" text-anchor="middle" font-size="14" font-weight="500" fill="#1e1b2e">${completionRate}%</text>
        <text x="48" y="57" text-anchor="middle" font-size="9" fill="#888780">Done</text>
      </svg>
      <div style="display:flex;flex-direction:column;gap:7px;flex:1">
        ${[
          { color:"#4ade80", label:"Done",        count: done       },
          { color:"#60a5fa", label:"In Progress",  count: inProgress },
          { color:"#fbbf24", label:"Pending",      count: pending    },
          { color:"#f87171", label:"Revision",     count: revision   },
        ].map(s => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
              <span style="font-size:12px;color:#444441">${s.label}</span>
            </div>
            <span style="font-size:12px;font-weight:500;color:#1e1b2e">${s.count}</span>
          </div>`).join("")}
      </div>
    </div>
  </div>
  <div style="padding:24px">
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1.5px;color:#888780;margin-bottom:16px">งานแยก Workflow</div>
    <div style="display:flex;flex-direction:column;gap:10px">${wfBarRows}</div>
  </div>
</div>

<div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:0.5px solid #ebe9e1">
  <div style="padding:16px 20px;border-right:0.5px solid #ebe9e1">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888780;margin-bottom:6px">Completion Rate</div>
    <div style="font-size:20px;font-weight:500;color:#15803d">${completionRate}%</div>
    <div style="margin-top:6px;height:3px;background:#f1f0ed;border-radius:2px;overflow:hidden">
      <div style="height:100%;width:${completionRate}%;background:#4ade80;border-radius:2px"></div>
    </div>
  </div>
  <div style="padding:16px 20px;border-right:0.5px solid #ebe9e1">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888780;margin-bottom:6px">Revision Rate</div>
    <div style="font-size:20px;font-weight:500;color:#b45309">${revisionRate}%</div>
    <div style="margin-top:6px;height:3px;background:#f1f0ed;border-radius:2px;overflow:hidden">
      <div style="height:100%;width:${Math.min(revisionRate, 100)}%;background:#fbbf24;border-radius:2px"></div>
    </div>
  </div>
  <div style="padding:16px 20px;border-right:0.5px solid #ebe9e1">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888780;margin-bottom:6px">Overdue</div>
    <div style="font-size:20px;font-weight:500;color:${overdue > 0 ? "#dc2626" : "#15803d"}">${overdue} งาน</div>
    <div style="font-size:10px;color:#888780;margin-top:4px">${total ? Math.round((overdue / total) * 100) : 0}% ของทั้งหมด</div>
  </div>
  <div style="padding:16px 20px">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888780;margin-bottom:6px">Avg. Turnaround</div>
    <div style="font-size:20px;font-weight:500;color:#1e1b2e">${avgDays > 0 ? avgDays + " วัน" : "—"}</div>
    <div style="font-size:10px;color:#888780;margin-top:4px">เฉลี่ยต่องาน Done</div>
  </div>
</div>

<div style="padding:20px 28px;border-bottom:0.5px solid #ebe9e1">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <div style="width:3px;height:16px;background:#4f46e5;border-radius:2px"></div>
    <div style="font-size:11px;font-weight:500;color:#1e1b2e;text-transform:uppercase;letter-spacing:1px">สรุปแยก Workflow</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
    <thead>
      <tr style="background:#f9f8f5">
        <th style="padding:8px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:22%">Workflow</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">ทั้งหมด</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Done</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">In Progress</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Pending</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">% Done</th>
      </tr>
    </thead>
    <tbody>${wfTableRows}</tbody>
  </table>
</div>

<div style="padding:20px 28px;border-bottom:0.5px solid #ebe9e1">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <div style="width:3px;height:16px;background:#a78bfa;border-radius:2px"></div>
    <div style="font-size:11px;font-weight:500;color:#1e1b2e;text-transform:uppercase;letter-spacing:1px">ประเภทงานย่อย (SubType)</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
    <thead>
      <tr style="background:#f9f8f5">
        <th style="padding:8px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:24%">ประเภทย่อย</th>
        <th style="padding:8px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:18%">Workflow</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">ทั้งหมด</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Done</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">In Progress</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">Pending</th>
        <th style="padding:8px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px">% Done</th>
      </tr>
    </thead>
    <tbody>${subTypeRows}</tbody>
  </table>
</div>

<div style="padding:20px 28px">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <div style="width:3px;height:16px;background:#4f46e5;border-radius:2px"></div>
    <div style="font-size:11px;font-weight:500;color:#1e1b2e;text-transform:uppercase;letter-spacing:1px">รายการงานทั้งหมด (${total} งาน)</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
    <thead>
      <tr style="background:#f9f8f5">
        <th style="padding:7px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:18%">Job ID</th>
        <th style="padding:7px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:30%">ประเภท / ย่อย</th>
        <th style="padding:7px 10px;text-align:left;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:20%">Deadline</th>
        <th style="padding:7px 10px;text-align:center;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:17%">สถานะ</th>
        <th style="padding:7px 10px;text-align:right;font-weight:500;color:#888780;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;width:15%">แก้ไข</th>
      </tr>
    </thead>
    <tbody>${jobRows}</tbody>
  </table>
</div>

<div style="padding:14px 28px;background:#f9f8f5;border-top:0.5px solid #ebe9e1;display:flex;justify-content:space-between;align-items:center">
  <div style="display:flex;align-items:center;gap:8px">
    <div style="width:20px;height:20px;background:#1e1b2e;border-radius:4px;display:flex;align-items:center;justify-content:center">
      <div style="width:8px;height:8px;background:#a78bfa;border-radius:2px"></div>
    </div>
    <span style="font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#888780">Support Teambon VT Market</span>
  </div>
  <span style="font-size:10px;color:#b4b2a9">พิมพ์เมื่อ ${printDate}</span>
</div>

</div>
<script>window.onload = () => setTimeout(() => window.print(), 300);</script>
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const toggleCard = (jobId: string) => setExpandedCards((p) => ({ ...p, [jobId]: !p[jobId] }));
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
            next[j.jobId] = prev[j.jobId] ?? { status: j.status || "Pending", deliveryLink: j.deliveryLink || "", internalNote: j.internalNote || "" };
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
        body: JSON.stringify({ jobId, status: edit.status, deliveryLink: edit.deliveryLink, internalNote: edit.internalNote }),
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
    return edit.status !== (job.status || "Pending") || edit.deliveryLink !== (job.deliveryLink || "") || edit.internalNote !== (job.internalNote || "");
  };

  const handlePriority = async (jobId: string, current: string) => {
    const newPriority = current === "urgent" ? "" : "urgent";
    const token = sessionStorage.getItem("adminAuth") || "";
    try {
      await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId, priority: newPriority }),
      });
      setJobs((p) => p.map((j) => j.jobId === jobId ? { ...j, priority: newPriority } : j));
    } catch {}
  };

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "Pending" || !j.status).length,
    inProgress: jobs.filter((j) => j.status === "In Progress" || j.status === "กำลังทำ").length,
    done: jobs.filter((j) => j.status === "Done" || j.status === "เสร็จแล้ว").length,
    revision: jobs.filter((j) => j.status === "Revision").length,
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
      (filter === "Revision" && j.status === "Revision") ||
      (filter === "Overdue" && isOverdue(j.deadline, j.status));
    const matchWorkflow = workflowFilter === "ทั้งหมด" || getWorkflow(j.task) === workflowFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || j.jobId.toLowerCase().includes(q) || j.customerName.toLowerCase().includes(q) || j.agent.toLowerCase().includes(q);
    return matchStatus && matchWorkflow && matchSearch;
  });

  const overdueCount = jobs.filter((j) => isOverdue(j.deadline, j.status)).length;

  const exportCSV = () => {
    const headers = ["Job ID", "ลูกค้า", "เซลล์", "ประเภทงาน", "ประเภทย่อย", "Deadline", "สถานะ", "Delivery Link", "วันที่สั่ง", "Priority", "Note ภายใน"];
    const rows = filtered.map((j) => [j.jobId, j.customerName, j.agent, j.task, j.subType, formatDate(j.deadline), j.status, j.deliveryLink, j.timestamp, j.priority === "urgent" ? "ด่วน" : "", j.internalNote]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teambon-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const doExport = (XLSX: any) => {
      const data = [
        ["Job ID", "ลูกค้า", "เซลล์", "ประเภทงาน", "ประเภทย่อย", "Deadline", "สถานะ", "Delivery Link", "วันที่สั่ง", "Priority", "Note ภายใน"],
        ...filtered.map((j) => [
          j.jobId, j.customerName, j.agent, j.task, j.subType,
          formatDate(j.deadline), j.status, j.deliveryLink, j.timestamp,
          j.priority === "urgent" ? "ด่วน" : "", j.internalNote,
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      // Column widths
      ws["!cols"] = [12, 20, 15, 15, 15, 15, 14, 30, 22, 8, 30].map((w) => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, "Jobs");
      XLSX.writeFile(wb, `teambon-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };
    if ((window as any).XLSX) {
      doExport((window as any).XLSX);
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = () => doExport((window as any).XLSX);
      document.head.appendChild(s);
    }
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
            📥 CSV
          </button>
          <button onClick={exportExcel} className="bg-emerald-500/80 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
            📊 Excel
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

                {/* Trend + SLA row */}
                <div className="grid grid-cols-2 gap-3">

                  {/* Trend chart — job volume per month (all data) */}
                  {(() => {
                    const trendMonths = Object.keys(monthJobsMap).slice(-8).reverse();
                    const maxVal = Math.max(...trendMonths.map((m) => monthJobsMap[m].length), 1);
                    return (
                      <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">📈 Trend งานรายเดือน</p>
                        {trendMonths.length < 2 ? (
                          <p className="text-xs text-gray-400 text-center py-4">ต้องการข้อมูลอย่างน้อย 2 เดือน</p>
                        ) : (
                          <div className="flex items-end gap-1.5 h-28 px-1">
                            {trendMonths.map((m) => {
                              const cnt = monthJobsMap[m].length;
                              const pct = Math.round((cnt / maxVal) * 100);
                              const isSelected = m === selectedMonth && !useDateRange;
                              return (
                                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-xs font-bold text-gray-700">{cnt}</span>
                                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 8)}%`, background: isSelected ? "#7c3aed" : "#c4b5fd" }} />
                                  <span className="text-[9px] text-gray-400 text-center leading-tight">{m.replace(" ", "\n")}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* SLA per workflow */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">🎯 SLA — ส่งงานทันเวลา</p>
                    {reportByWorkflow.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">ไม่มีข้อมูล</p>
                    ) : (
                      <div className="space-y-2.5">
                        {reportByWorkflow.map(({ wf, total, jobs: wfJobs }) => {
                          const ws = WF_STYLE[wf];
                          const overdueInWf = wfJobs.filter((j) => isOverdue(j.deadline, j.status)).length;
                          const sla = total ? Math.round(((total - overdueInWf) / total) * 100) : 100;
                          const slaColor = sla >= 80 ? "bg-green-400" : sla >= 50 ? "bg-amber-400" : "bg-red-400";
                          const slaText  = sla >= 80 ? "text-green-600" : sla >= 50 ? "text-amber-600" : "text-red-500";
                          return (
                            <div key={wf}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={`font-semibold flex items-center gap-1 ${ws.text}`}>
                                  {ws.icon} {wf}
                                </span>
                                <span className={`font-bold ${slaText}`}>{sla}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className={`${slaColor} h-2 rounded-full transition-all`} style={{ width: `${sla}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[10px] text-gray-400 pt-1">* SLA = % งานที่ยังไม่เกินกำหนด</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* 2-col layout: Customer ranking (left) + Workflow breakdown (right) */}
                <div className="grid grid-cols-3 gap-3 items-start">

                  {/* LEFT — Customer ranking */}
                  <div className="col-span-1">
                    {reportJobs.length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                        <p className="text-gray-400 text-sm">ไม่มีข้อมูล</p>
                      </div>
                    ) : (() => {
                      const custMap: Record<string, number> = {};
                      reportJobs.forEach((j) => {
                        const name = j.customerName || "ไม่ระบุ";
                        custMap[name] = (custMap[name] || 0) + 1;
                      });
                      const ranked = Object.entries(custMap).sort((a, b) => b[1] - a[1]);
                      const max = ranked[0]?.[1] || 1;
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">👑 ลูกค้าสั่งงานสูงสุด</p>
                          <div className="space-y-3">
                            {ranked.map(([name, count], idx) => {
                              const pct = Math.round((count / max) * 100);
                              return (
                                <div key={name}>
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                                      <span>{medals[idx] ?? `#${idx + 1}`}</span>
                                      <span className="truncate max-w-[140px]">{name}</span>
                                    </span>
                                    <span className="font-bold text-purple-700 shrink-0">{count} งาน</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full transition-all"
                                      style={{
                                        width: `${pct}%`,
                                        background: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#cd7f32" : "#a78bfa",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT — Workflow breakdown */}
                  <div className="col-span-2">
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
                              <div className="px-5 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                                    <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: `${donePct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-green-600 w-12 text-right">{donePct}% Done</span>
                                </div>
                                {/* subType chips */}
                                {(() => {
                                  const stCount: Record<string, number> = {};
                                  wfJobs.forEach((j) => { if (j.subType) stCount[j.subType] = (stCount[j.subType] || 0) + 1; });
                                  const entries = Object.entries(stCount).sort((a, b) => b[1] - a[1]);
                                  return entries.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 pt-1 pb-1">
                                      {entries.map(([st, cnt]) => (
                                        <span key={st} className={`text-xs px-2.5 py-0.5 rounded-full bg-white/70 border ${ws.border} ${ws.text} font-semibold`}>
                                          {st} <span className="opacity-60">×{cnt}</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : null;
                                })()}
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
                  </div>

                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════ JOBS TAB ══════════════════════ */}
        {activeTab === "jobs" && (
          <div className="space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: "ทั้งหมด",    count: stats.total,       bg: "bg-white border-gray-200",         text: "text-gray-700"   },
                { label: "Pending",    count: stats.pending,     bg: "bg-amber-50 border-amber-200",     text: "text-amber-700"  },
                { label: "In Progress",count: stats.inProgress,  bg: "bg-blue-50 border-blue-200",       text: "text-blue-700"   },
                { label: "Done",       count: stats.done,        bg: "bg-green-50 border-green-200",     text: "text-green-700"  },
                { label: "Revision",   count: stats.revision,    bg: "bg-orange-50 border-orange-200",   text: "text-orange-700" },
                { label: "Overdue",    count: overdueCount,      bg: "bg-red-50 border-red-200",         text: "text-red-700"    },
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
                    <div key={job.jobId} className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${job.priority === "urgent" ? "border-orange-400 ring-2 ring-orange-200" : cardBg(edit.status, overdue)}`}>
                      {/* Priority banner */}
                      {job.priority === "urgent" && (
                        <div className="bg-orange-500 px-4 py-1 flex items-center gap-2">
                          <span className="text-white text-xs font-black tracking-widest uppercase">🚨 งานด่วน — Priority</span>
                        </div>
                      )}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePriority(job.jobId, job.priority); }}
                            title={job.priority === "urgent" ? "ยกเลิกงานด่วน" : "ตั้งเป็นงานด่วน"}
                            className={`text-sm px-2 py-0.5 rounded-lg border transition font-bold ${
                              job.priority === "urgent"
                                ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                                : "bg-white text-gray-400 border-gray-200 hover:border-orange-400 hover:text-orange-500"
                            }`}
                          >
                            🚨
                          </button>
                          <span className="text-xs text-gray-400 shrink-0">{job.timestamp}</span>
                        </div>
                      </div>

                      {/* Card summary — always visible, click to expand */}
                      <div
                        className="px-5 py-4 space-y-3 cursor-pointer select-none"
                        onClick={() => toggleCard(job.jobId)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-3">
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
                                <span className={`font-medium ${overdue ? "text-red-600" : "text-gray-800"}`}>{formatDate(job.deadline)}</span>
                              </div>
                            </div>

                            {/* Workflow badge + subType + params chips */}
                            <div className="flex flex-wrap items-center gap-2">
                              {job.task && (
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
                              )}
                              {job.subType && (
                                <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full">{job.subType}</span>
                              )}
                              {job.workflowParams && job.workflowParams.split("|").map((p) => p.trim()).filter(Boolean).map((p) => (
                                <span key={p} className="text-xs bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{p}</span>
                              ))}
                            </div>
                          </div>

                          {/* Chevron */}
                          <span className="text-gray-300 text-lg mt-1 shrink-0 transition-transform duration-200" style={{ transform: expandedCards[job.jobId] ? "rotate(180deg)" : "rotate(0deg)" }}>
                            ▾
                          </span>
                        </div>
                      </div>

                      {/* Card detail — shown only when expanded */}
                      {expandedCards[job.jobId] && (
                        <div className="px-5 pb-4 space-y-3 border-t border-gray-50 pt-3">
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
                                    onClick={(e) => { e.stopPropagation(); window.open(url.trim(), "_blank"); }} />
                                  <div className="flex items-center justify-between px-3 py-1.5 bg-white">
                                    <span className="text-xs font-medium text-gray-800">รูปที่ {idx + 1}</span>
                                    <a href={url.trim()} target="_blank" rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow transition">
                                      ↗ เปิดใน Drive
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Edit controls */}
                          <div className="space-y-2 pt-1 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                            {/* Internal note */}
                            <div>
                              <p className="text-xs text-gray-400 mb-1 font-medium">🔒 Note ภายใน <span className="text-gray-300">(ลูกค้าไม่เห็น)</span></p>
                              <textarea
                                className="w-full p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-300 outline-none text-gray-800 resize-none bg-yellow-50 placeholder-gray-300"
                                placeholder="เช่น รอไฟล์จากเซลล์, ติดต่อลูกค้าอีกครั้ง..."
                                rows={2}
                                value={edit.internalNote ?? ""}
                                onChange={(e) => setEditState((p) => ({ ...p, [job.jobId]: { ...edit, internalNote: e.target.value } }))}
                              />
                            </div>
                            <div className="flex gap-2 items-end flex-wrap">
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
                      )}
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
