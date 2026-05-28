"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "success" | "already" | "error";

export default function ApprovePage() {
  const [status, setStatus]   = useState<Status>("loading");
  const [jobId, setJobId]     = useState("");
  const [errMsg, setErrMsg]   = useState("");

  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const jId        = params.get("jobId")      || "";
    const lineUserId = params.get("lineUserId") || "";

    setJobId(jId);

    if (!jId) {
      setErrMsg("ไม่พบ Job ID");
      setStatus("error");
      return;
    }

    fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: jId, lineUserId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "FORBIDDEN") {
          setErrMsg("ไม่มีสิทธิ์ Approve งานนี้");
          setStatus("error");
        } else if (data.error === "NOT_FOUND") {
          setErrMsg("ไม่พบงาน " + jId);
          setStatus("error");
        } else if (data.error) {
          setErrMsg(data.message || data.error);
          setStatus("error");
        } else if (data.alreadyApproved) {
          setStatus("already");
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setErrMsg("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setStatus("error");
      });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">

        {status === "loading" && (
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
            <p className="text-gray-500 text-sm">กำลังดำเนินการ...</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="bg-green-500 px-6 py-5 flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="text-white font-bold text-lg leading-tight">Approved เรียบร้อย!</p>
                <p className="text-green-100 text-xs mt-0.5">SUPPORT TEAMBON VT MARKET</p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-semibold text-sm">Job {jobId}</p>
                <p className="text-green-600 text-xs mt-1">ได้รับการ Approve เรียบร้อยแล้ว</p>
              </div>
              <p className="text-gray-500 text-xs text-center leading-relaxed">
                ขอบคุณที่ใช้บริการ TEAMBON นะคะ<br />ทีมงานได้รับทราบเรียบร้อยแล้ว 🙏
              </p>
              <p className="text-gray-300 text-xs text-center">สามารถปิดหน้านี้ได้เลย</p>
            </div>
          </>
        )}

        {status === "already" && (
          <>
            <div className="bg-emerald-500 px-6 py-5 flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="text-white font-bold text-lg leading-tight">Approved ไปแล้ว</p>
                <p className="text-emerald-100 text-xs mt-0.5">SUPPORT TEAMBON VT MARKET</p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-800 font-semibold text-sm">Job {jobId}</p>
                <p className="text-emerald-600 text-xs mt-1">งานนี้ได้รับการ Approve ไปแล้ว</p>
              </div>
              <p className="text-gray-300 text-xs text-center">สามารถปิดหน้านี้ได้เลย</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="bg-red-500 px-6 py-5 flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <p className="text-white font-bold text-lg leading-tight">ไม่สามารถ Approve ได้</p>
                <p className="text-red-100 text-xs mt-0.5">SUPPORT TEAMBON VT MARKET</p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-700 text-sm">{errMsg}</p>
              </div>
              <p className="text-gray-400 text-xs text-center">หากมีปัญหา กรุณาติดต่อทีมงานโดยตรง</p>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
