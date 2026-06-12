"use client";

import { useState, useEffect } from "react";

// ใช้ Vercel proxy เดิม (เชื่อม Google Sheets ผ่าน Apps Script)
const SCRIPT_URL = "/api/gas";

const ADMIN_LIST = ["ING", "NAT", "FEW", "BON"] as const;
type AdminName = (typeof ADMIN_LIST)[number];

const ADMIN_STYLE: Record<AdminName, { badge: string }> = {
  ING: { badge: "bg-purple-100 text-purple-700 border-purple-200" },
  NAT: { badge: "bg-blue-100 text-blue-700 border-blue-200" },
  FEW: { badge: "bg-pink-100 text-pink-700 border-pink-200" },
  BON: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const LEAVE_TYPES = ["ลาป่วย", "ลากิจ", "ลาพักร้อน", "ลาคลอด", "อื่นๆ"];

type LeaveRecord = {
  id: string;
  name: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number | string;
  reason: string;
  status: string;
  timestamp: string;
};

const TODAY = new Date().toISOString().split("T")[0];

function formatDateTH(dateStr: string) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function LeavePage() {
  const [me, setMe] = useState<AdminName | "">("");

  // FORM
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // LIST
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | AdminName>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("leaveAdminName");
      if (saved && (ADMIN_LIST as readonly string[]).includes(saved)) setMe(saved as AdminName);
    } catch {}
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=leave_list`);
      const data = await res.json();
      setLeaves(Array.isArray(data.leaves) ? data.leaves : []);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const selectMe = (name: AdminName) => {
    setMe(name);
    try {
      localStorage.setItem("leaveAdminName", name);
    } catch {}
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    if (!me) {
      setError("กรุณาเลือกชื่อของคุณก่อน");
      return;
    }
    if (!startDate || !endDate) {
      setError("กรุณาเลือกวันที่ลา");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("วันสุดท้ายต้องไม่ก่อนวันเริ่มลา");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          type: "leave_create",
          name: me,
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });
      if (!res.ok) throw new Error();
      setReason("");
      setSuccess(true);
      await fetchLeaves();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ type: "leave_delete", id }),
      });
      if (!res.ok) throw new Error();
      await fetchLeaves();
    } catch {
      // silent fail
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = leaves
    .filter((l) => filter === "ALL" || l.name === filter)
    .slice()
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  const inputCls =
    "w-full p-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-300 outline-none transition";
  const labelCls = "text-sm font-semibold text-gray-700 flex items-center gap-2";
  const card = "bg-white border border-gray-100 rounded-2xl shadow-sm p-6";
  const btnPrimary =
    "w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100";

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-700" />
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-purple-400/30 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-indigo-400/30 rounded-full blur-2xl" />
          <div className="relative px-8 py-8 flex flex-col items-center text-center">
            <span className="text-4xl mb-2">🗓️</span>
            <h1 className="text-2xl font-black tracking-widest uppercase text-white">ระบบลางาน</h1>
            <p className="text-purple-100 text-sm mt-1">Support Teambon — สำหรับแอดมิน ING · NAT · FEW · BON</p>
          </div>
        </div>

        {/* WHO ARE YOU */}
        <div className={card + " space-y-3"}>
          <label className={labelCls}>👤 คุณคือใคร?</label>
          <div className="grid grid-cols-4 gap-2">
            {ADMIN_LIST.map((name) => (
              <button
                key={name}
                onClick={() => selectMe(name)}
                className={`py-3 rounded-xl border-2 font-bold transition ${
                  me === name
                    ? "border-purple-400 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-500 hover:border-purple-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {!me && <p className="text-xs text-gray-400">เลือกชื่อของคุณ ระบบจะจำไว้ในเครื่องนี้ให้อัตโนมัติ</p>}
        </div>

        {/* FORM */}
        <div className={card + " space-y-4"}>
          <h2 className="text-lg font-bold text-gray-800">📝 ขอลา / บันทึกการลา</h2>

          <div>
            <label className={labelCls}>ประเภทการลา</label>
            <select className={inputCls} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              {LEAVE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>วันเริ่มลา</label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </div>
            <div>
              <label className={labelCls}>วันสุดท้าย</label>
              <input
                type="date"
                className={inputCls}
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              หมายเหตุ <span className="text-xs text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              className={inputCls + " h-20 resize-none"}
              placeholder="เช่น ลาไปธุระส่วนตัว..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm">⚠️ {error}</p>}
          {success && <p className="text-emerald-500 text-sm">✅ บันทึกการลาเรียบร้อยแล้ว</p>}

          <button className={btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span> กำลังบันทึก...
              </>
            ) : (
              "✅ บันทึกการลา"
            )}
          </button>
        </div>

        {/* LIST */}
        <div className={card + " space-y-4"}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">📋 รายการลาทั้งหมด</h2>
            <button onClick={fetchLeaves} className="text-xs text-purple-500 hover:underline">
              🔄 รีเฟรช
            </button>
          </div>

          {/* filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["ALL", ...ADMIN_LIST] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  filter === f
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"
                }`}
              >
                {f === "ALL" ? "ทั้งหมด" : f}
              </button>
            ))}
          </div>

          {/* list */}
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-6">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">ยังไม่มีรายการลา</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((l) => {
                const style =
                  ADMIN_STYLE[l.name as AdminName] || {
                    badge: "bg-gray-100 text-gray-600 border-gray-200",
                  };
                const sameDay = l.startDate === l.endDate;
                const days = Number(l.days) || 0;
                return (
                  <div
                    key={l.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-xs font-bold px-2 py-1 rounded-full border ${style.badge}`}>
                        {l.name}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {l.leaveType} {days > 1 ? `(${days} วัน)` : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          📅{" "}
                          {sameDay
                            ? formatDateTH(l.startDate)
                            : `${formatDateTH(l.startDate)} – ${formatDateTH(l.endDate)}`}
                        </p>
                        {l.reason && <p className="text-xs text-gray-400 mt-0.5">📝 {l.reason}</p>}
                      </div>
                    </div>
                    {me === l.name && (
                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deletingId === l.id}
                        className="text-xs text-red-400 hover:text-red-600 transition shrink-0"
                      >
                        {deletingId === l.id ? "..." : "ลบ"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
