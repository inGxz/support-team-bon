"use client";

import { useState } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQc-fubbnh57WsugTUeXRnp9afLXDAF8HdXXa34pyM6DMpvZOaOJJljPowuH6POdcs/exec";

export default function Page() {
  // ================= BASIC =================
  const [customerName, setCustomerName] = useState("");
  const [agent, setAgent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [detail, setDetail] = useState("");

  const [taskType, setTaskType] = useState("");

  // ================= VIDEO =================
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState("");
  const [goal, setGoal] = useState("");
  const [mood, setMood] = useState("");
  const [music, setMusic] = useState("");
  const [voice, setVoice] = useState("");

  // ================= DESIGN =================
  const [designType, setDesignType] = useState("");

  // ================= ADS =================
  const [adsType, setAdsType] = useState("");

  // ================= TRACK =================
  const [trackingId, setTrackingId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);

  // ================= UI =================
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ================= STYLE =================
  const card =
    "bg-white border border-gray-100 rounded-2xl shadow-sm p-6";

  const input =
    "w-full p-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-300 outline-none";

  const button =
    "w-full p-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 text-white font-semibold shadow-md hover:scale-[1.02] transition flex items-center justify-center gap-2";

  const smallBtn =
    "px-4 py-2 rounded-xl bg-purple-500 text-white";

  // ================= TOAST =================
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 15000);
  };

  // ================= RESET =================
  const resetAll = () => {
    setTaskType("");
    setStep(0);
    setPlatform("");
    setGoal("");
    setMood("");
    setMusic("");
    setVoice("");
    setDesignType("");
    setAdsType("");
    setDeadline("");
    setDetail("");
  };

  // ================= SUBMIT =================
  const submitTask = async (task: string, extra: string) => {
    if (!customerName || !agent) return;

    setLoading(true);
    showToast("⏳ กำลังส่งงาน...");

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "create",
        customerName,
        agent,
        taskType,
        task,
        detail: `${extra} | ${detail} | Deadline: ${deadline}`,
        deadline,
      }),
    });

    const data = await res.json();

    setLoading(false);
    showToast(`✅ งานของคุณคือ Job ID: ${data.jobId}`);

    resetAll();
  };

  // ================= TRACK =================
  const trackJob = async () => {
    const res = await fetch(`${SCRIPT_URL}?jobId=${trackingId}`);
    const data = await res.json();
    setTrackResult(data);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 text-gray-900">

      {/* 🔵 LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
            <span className="animate-spin">⏳</span>
            <p className="font-semibold">กำลังส่งงาน... กรุณารอสถานะ Job ID</p>
          </div>
        </div>
      )}

      {/* 🟢 TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-2xl shadow-md">
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={card}>
          <h1 className="text-3xl font-bold">🚀 SUPPORT TEAMBON VT MARKET</h1>
          <p className="text-gray-500">Premium Workflow System</p>
        </div>

        {/* ================= CUSTOMER ================= */}
        <div className={card + " space-y-3"}>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              👤 ลูกค้า
              <span className="text-xs text-gray-400">(กรุณาใส่ชื่อ)</span>
            </label>
          <input
            className={input}
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              🧑‍💼 เซลล์
              <span className="text-xs text-gray-400">(ผู้ดูแล)</span>
            </label>
          <input
            className={input}
            placeholder="Agent Name"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          />

          {/* 📅 DEADLINE FIXED */}
          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              📅 Deadline
              <span className="text-xs text-gray-400">(วันครบกำหนดส่งงาน)</span>
            </label>

            <input
              type="date"
              className={input}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <p className="text-xs text-gray-400 mt-1">
              ⚠️ กรุณาเลือกวันที่ต้องการให้ส่งงานเสร็จ
            </p>
          </div>

          <textarea
            className={input + " h-24"}
            placeholder="Detail / Notes..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>

        {/* ================= TASK TYPE ================= */}
        {!taskType && (
          <div className={card + " space-y-3"}>
            <h2 className="text-xl font-semibold">Select Workflow</h2>

            <button className={button} onClick={() => setTaskType("Video")}>
              🎬 Video Workflow
            </button>

            <button className={button} onClick={() => setTaskType("Design")}>
              🎨 Design Workflow
            </button>

            <button className={button} onClick={() => setTaskType("Ads")}>
              📢 Ads Workflow
            </button>
          </div>
        )}

        {/* ================= VIDEO ================= */}
        {taskType === "Video" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-semibold">🎬 Video Workflow</h2>

            {step === 0 && (
              <>
                <select className={input} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option>Platform</option>
                  <option>TikTok</option>
                  <option>Facebook Reels</option>
                  <option>YouTube Shorts</option>
                  <option>YouTube Long</option>
                </select>
                <button className={button} onClick={() => setStep(1)}>Next</button>
              </>
            )}

            {step === 1 && (
              <>
                <select className={input} value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option>Goal</option>
                  <option>Branding</option>
                  <option>Client Story</option>
                  <option>Motivation</option>
                  <option>Event Promotion</option>
                  <option>Lead Generation</option>
                  <option>Education</option>
                  <option>Lifestyle&Vlog</option>
                </select>
                <button className={button} onClick={() => setStep(2)}>Next</button>
              </>
            )}

            {step === 2 && (
              <>
                <select className={input} value={mood} onChange={(e) => setMood(e.target.value)}>
                  <option>Mood</option>
                  <option>Cinematic</option>
                  <option>Luxury</option>
                  <option>Vlog</option>
                  <option>Fast Cut</option>
                  <option>Documentary</option>
                  <option>Inspirational</option>
                  <option>Professional</option>
                  <option>Casual</option>
                </select>
                <button className={button} onClick={() => setStep(3)}>Next</button>
              </>
            )}

            {step === 3 && (
              <>
                <select className={input} value={music} onChange={(e) => setMusic(e.target.value)}>
                  <option>Music</option>
                  <option>Epic</option>
                  <option>Lo-fi</option>
                  <option>Motivational</option>
                  <option>Cinematic</option>
                  <option>ไม่มีเพลง</option>
                  <option>แล้วแต่ตัดต่อ</option>
                  
                </select>
                <button className={button} onClick={() => setStep(4)}>Next</button>
              </>
            )}

            {step === 4 && (
              <>
                <select className={input} value={voice} onChange={(e) => setVoice(e.target.value)}>
                  <option>Voice</option>
                  <option>AI Voice</option>
                  <option>Real Voice</option>
                  <option>ไม่มี</option>
                  <option>พากย์เสียงใหม่</option>          
                </select>

                <button
                  className={button}
                  onClick={() =>
                    submitTask(
                      "Video",
                      `Platform:${platform}, Goal:${goal}, Mood:${mood}, Music:${music}, Voice:${voice}`
                    )
                  }
                >
                  🚀 Create Task
                </button>
              </>
            )}
          </div>
        )}

        {/* ================= DESIGN ================= */}
        {taskType === "Design" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-semibold">🎨 Design Workflow</h2>

            <select className={input}>
              <option>Logo</option>
              <option>Poster</option>
              <option>Banner</option>
              <option>Infographic</option>
              <option>PDF</option>
              <option>Profile</option>
              <option>อื่นๆ</option>
            </select>

            <button className={button} onClick={() => submitTask("Design", detail)}>
              🚀 Create Task
            </button>
          </div>
        )}

        {/* ================= ADS ================= */}
        {taskType === "Ads" && (
          <div className={card + " space-y-4"}>
            <h2 className="text-xl font-semibold">📢 Ads Workflow</h2>

            <select className={input}>
              <option>Facebook Ads</option>
              <option>Google Ads</option>
              <option>TikTok Ads</option>
            </select>

            <button className={button} onClick={() => submitTask("Ads", detail)}>
              🚀 Create Task
            </button>
          </div>
        )}

        {/* ================= TRACK ================= */}
        <div className={card + " space-y-3"}>
          <h2 className="text-xl font-semibold">🔍 Track Job ID</h2>

          <div className="flex gap-2">
            <input
              className={input}
              placeholder="Enter Job ID"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
            <button className={smallBtn} onClick={trackJob}>
              Search
            </button>
          </div>

          {trackResult && (
            <div className="p-4 bg-white border rounded-xl">
              <p><b>Status:</b> {trackResult.status}</p>
              <p><b>Task:</b> {trackResult.task}</p>
              <p><b>Detail:</b> {trackResult.detail}</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}