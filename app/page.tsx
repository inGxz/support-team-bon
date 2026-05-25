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

  // ================= TRACKING =================
  const [trackingId, setTrackingId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);

  // ================= UI =================
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ================= STYLE SYSTEM =================
  const card =
    "bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-sm p-6";

  const input =
    "w-full p-3 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-purple-300 outline-none";

  const button =
    "w-full p-3 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 text-white font-semibold shadow-md hover:scale-[1.02] transition";

  const smallBtn =
    "px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-indigo-400 text-white";

  // ================= TOAST =================
  const showToast = (jobId: string) => {
    setToast(jobId);
    setTimeout(() => setToast(null), 6000);
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

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "create",
        customerName,
        agent,
        taskType,
        task,
        detail: `${extra} | Detail:${detail} | Deadline:${deadline}`,
        deadline,
      }),
    });

    const data = await res.json();

    showToast(data.jobId);

    resetAll();
    setLoading(false);
  };

  // ================= TRACK =================
  const trackJob = async () => {
    const res = await fetch(`${SCRIPT_URL}?jobId=${trackingId}`);
    const data = await res.json();
    setTrackResult(data);
  };

  // ================= UI =================
  return (
    <main className="min-h-screen bg-[#f6f7fb] p-4 text-gray-900">

      {/* ✅ SUCCESS TOAST (GREEN) */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-2xl shadow-lg">
            <p className="font-bold">✅ สถานะงานของคุณคือ</p>
            <p className="text-sm">Job ID: {toast}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className={card}>
          <h1 className="text-3xl font-bold">🚀 SUPPORT TEAMBON WORKFLOW</h1>
          <p className="text-gray-500">Premium Workflow Management</p>
        </div>

        {/* ================= CUSTOMER ================= */}
        <div className={card + " space-y-3"}>

          <input
            className={input}
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className={input}
            placeholder="Agent Name"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          />

          {/* DEADLINE */}
          <div>
            <label className="text-sm font-semibold">
              📅 Deadline <span className="text-gray-400">(วันครบกำหนดส่งงาน)</span>
            </label>
            <input
              type="date"
              className={input}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* DETAIL */}
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
                  <option>Lead Generation</option>
                  <option>Event Promotion</option>
                  <option>Education</option>
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
                  <option>Professional</option>
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
                  <option>ไม่มีเพลง</option>
                </select>

                <button className={button} onClick={() => setStep(4)}>Next</button>
              </>
            )}

            {step === 4 && (
              <>
                <select className={input} value={voice} onChange={(e) => setVoice(e.target.value)}>
                  <option>Voice</option>
                  <option>AI Voice</option>
                  <option>เสียงจริง</option>
                  <option>ไม่มี</option>
                </select>

                <button
                  className={button}
                  onClick={() =>
                    submitTask(
                      "Video Production",
                      `Platform:${platform}, Goal:${goal}, Mood:${mood}, Music:${music}, Voice:${voice}`
                    )
                  }
                >
                  🚀 Create Video Task
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
            </select>

            <button className={button} onClick={() => submitTask("Design Work", detail)}>
              🚀 Create Design Task
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
              <option>Campaign Setup</option>
            </select>

            <button className={button} onClick={() => submitTask("Ads Campaign", detail)}>
              🚀 Create Ads Task
            </button>
          </div>
        )}

        {/* ================= TRACKING ================= */}
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
            <div className="p-4 border rounded-xl bg-white">
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