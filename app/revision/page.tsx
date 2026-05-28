"use client";

import { useEffect, useState } from "react";

// ใช้ Vercel proxy แทน GAS โดยตรง (หลีก CORS redirect บน mobile)
const GAS_URL = "/api/gas";

type JobData = {
  jobId: string;
  customerName: string;
  task: string;
  agent: string;
  status: string;
  deadline: string;
};

export default function RevisionPage() {
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMsg, setLoadErrorMsg] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // อ่าน ?jobId= จาก URL แล้วโหลดข้อมูลงาน
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("jobId") || "";
    setJobId(id);
    if (!id) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    fetch(`${GAS_URL}?jobId=${encodeURIComponent(id)}&source=revision`, { signal: controller.signal })
      .then((r) => r.text())
      .then((text) => {
        clearTimeout(timer);
        try {
          const data = JSON.parse(text);
          if (data.error) {
            setLoadError(true);
            setLoadErrorMsg(`GAS error: ${data.error} | ${data.message || ""} | jobId: ${id}`);
          } else {
            setJob(data);
          }
        } catch {
          setLoadError(true);
          setLoadErrorMsg(`JSON parse failed: ${text.substring(0, 120)}`);
        }
      })
      .catch((err) => {
        setLoadError(true);
        setLoadErrorMsg(`Fetch error: ${String(err)}`);
      })
      .finally(() => setLoading(false));

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const handleSubmit = async () => {
    if (!note.trim() || !jobId) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/gas", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "revision",
          jobId,
          revisionNote: note.trim(),
        }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("ตอบกลับผิดรูปแบบ: " + text.substring(0, 80));
      }
      if (data.error) throw new Error(data.message || data.error);
      setDone(true);
    } catch (err: any) {
      setSubmitError(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลงาน...</p>
        </div>
      </main>
    );
  }

  // ─── Error: ไม่พบงาน ───────────────────────────────────────
  if (loadError || !job) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-4xl">😕</p>
          <p className="font-bold text-gray-700">ไม่พบข้อมูลงาน</p>
          <p className="text-gray-400 text-sm">
            {jobId ? `Job ID: ${jobId}` : "ไม่มี Job ID ใน URL"}
          </p>
          {loadErrorMsg && (
            <p className="text-left text-xs text-red-400 bg-red-50 rounded-lg p-2 break-all">
              {loadErrorMsg}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
          >
            🔄 ลองใหม่
          </button>
        </div>
      </main>
    );
  }

  // ─── Success ───────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-5xl">✅</p>
          <p className="font-bold text-gray-700 text-lg">ส่งคำขอแก้ไขแล้ว!</p>
          <p className="text-gray-400 text-sm">ทีมงานได้รับข้อความแล้ว<br />จะดำเนินการแก้ไขให้เร็วที่สุด</p>
          <div className="bg-gray-50 rounded-xl p-3 text-left text-sm space-y-1 mt-2">
            <p className="text-gray-500">Job ID: <span className="font-semibold text-gray-700">{job.jobId}</span></p>
            <p className="text-gray-500">งาน: <span className="font-semibold text-gray-700">{job.task}</span></p>
          </div>
        </div>
      </main>
    );
  }

  // ─── Revision Form ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-sm">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-5 py-4">
          <p className="text-white font-bold text-lg">🔄 ขอแก้ไขงาน</p>
          <p className="text-red-100 text-xs mt-0.5">{job.jobId}</p>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Job info */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">งาน</span>
              <span className="font-semibold text-gray-700 text-right max-w-[60%]">{job.task}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ลูกค้า</span>
              <span className="text-gray-700">{job.customerName}</span>
            </div>
            {job.agent && (
              <div className="flex justify-between">
                <span className="text-gray-400">ผู้รับผิดชอบ</span>
                <span className="text-gray-700">{job.agent}</span>
              </div>
            )}
          </div>

          {/* Note input */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-red-600">📝 รายละเอียดที่ต้องการแก้ไข</p>
            <textarea
              className="w-full p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-gray-800 resize-none focus:ring-2 focus:ring-red-300 outline-none"
              rows={4}
              placeholder="เช่น อยากให้เพิ่มข้อความตรงส่วน... / เปลี่ยนสีเป็น... / แก้ตัวสะกด..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
              ⚠️ {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!note.trim() || submitting}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition disabled:opacity-50"
          >
            {submitting ? "⏳ กำลังส่ง..." : "ส่งคำขอแก้ไข"}
          </button>

          <p className="text-center text-xs text-gray-400">
            ทีมงานจะได้รับแจ้งเตือนทันที
          </p>
        </div>
      </div>
    </main>
  );
}
