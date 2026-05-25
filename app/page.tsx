"use client";

import { useRef, useState } from "react";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQc-fubbnh57WsugTUeXRnp9afLXDAF8HdXXa34pyM6DMpvZOaOJJljPowuH6POdcs/exec";

export default function Page() {
  const formRef = useRef<HTMLDivElement>(null);

  const [taskName, setTaskName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [agent, setAgent] = useState("");
  const [reference, setReference] = useState("");
  const [detail, setDetail] = useState("");
  const [deadline, setDeadline] = useState("");

  const [tracking, setTracking] = useState("");
  const [result, setResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const categories = [
    "🎨 Design",
    "🎬 Video",
    "📢 Ads",
    "✍️ Content",
    "📷 Shoot",
    "⚙️ Other",
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const scrollToForm = (task: string) => {
    setTaskName(task);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const submitTask = async () => {
    if (!customerName || !agent || !taskName) {
      showToast("⚠️ กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          customerName,
          agent,
          task: taskName,
          reference,
          detail,
          deadline,
        }),
      });

      const data = await res.json();

      showToast("🚀 หมายเลขงานของคุณคือ: " + data.jobId);

      setTaskName("");
      setCustomerName("");
      setAgent("");
      setReference("");
      setDetail("");
      setDeadline("");
    } catch {
      showToast("❌ Submit Failed");
    }

    setLoading(false);
  };

  const searchJob = async () => {
    if (!tracking) return;

    setLoading(true);

    const res = await fetch(`${SCRIPT_URL}?jobId=${tracking}`);
    const data = await res.json();

    setResult(data);
    setLoading(false);
  };

  const statusBadge = (status: string) => {
    if (status === "Pending") return "badge-yellow";
    if (status === "In Progress") return "badge-blue";
    if (status === "Completed") return "badge-green";
    return "badge-gray";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 text-black p-4 md:p-6">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 px-5 py-3 rounded-full shadow-lg z-50 text-sm font-semibold border border-green-200">
        {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="card p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-black">
            🚀 Support Team Bon
          </h1>
          <p className="text-gray-600 mt-2">
            สะดวก • ติดตามผล • ใช้งานง่าย • ระบบสั่งงานการตลาดออนไลน์
          </p>
        </div>

        {/* CATEGORY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {categories.map((t, i) => (
            <div key={i} className="card p-5">
              <h2 className="font-bold">{t}</h2>

              <button
                onClick={() => scrollToForm(t)}
                className="btn-primary mt-4 w-full"
              >
                ➕ Create Task
              </button>
            </div>
          ))}
        </div>

        {/* FORM */}
        <div ref={formRef} className="card p-6 md:p-10 space-y-4">

          <h2 className="text-2xl md:text-3xl font-black">
            🧾 Create Task
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input
              placeholder="👤 Customer Name"
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <input
              placeholder="🧑‍💼 Agent"
              className="input"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
            />
          </div>

          {/* IMPORTANT FIELD (BLACK FOCUS) */}
          <input
            placeholder="📌 TASK NAME"
            className="input-black"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />

          <input
            placeholder="🔗 Reference"
            className="input"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <div className="space-y-1">
  
  {/* Label */}
  <label className="text-sm font-bold text-gray-700">
    ⏰ Deadline
  </label>

  {/* Input */}
  <input
    type="date"
    className="input"
    value={deadline}
    onChange={(e) => setDeadline(e.target.value)}
  />

  {/* Hint text */}
  <p className="text-xs text-gray-500">
    ⚠️ นี่คือวันครบกำหนดระยะเวลาในการส่งงาน
  </p>

</div>

          <textarea
            placeholder="📄 Detail"
            rows={5}
            className="input"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />

          <button
            onClick={submitTask}
            disabled={loading}
            className="btn-primary w-full py-4"
          >
            {loading ? "⏳ Processing..." : "🚀 Submit Task"}
          </button>
        </div>

        {/* TRACKING */}
        <div className="card p-6 md:p-10">

          <h2 className="text-2xl md:text-3xl font-black mb-4">
            🔍 Tracking Job
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">

            <input
              placeholder="Enter Job ID (STM-001)"
              className="input flex-1"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
            />

            <button
              onClick={searchJob}
              className="btn-black"
            >
              Search
            </button>
          </div>

          {result && !result.error && (
            <div className="mt-6 p-5 bg-white border rounded-2xl">

              <div className="flex justify-between items-center">
                <h3 className="text-xl md:text-2xl font-black">
                  📦 {result.jobId}
                </h3>

                <span className={`badge ${statusBadge(result.status)}`}>
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 font-medium">
                <p>👤 {result.customerName}</p>
                <p>🧑‍💼 {result.agent}</p>
                <p>📌 {result.task}</p>
                <p>⏰ {result.deadline}</p>
              </div>

              <p className="mt-3 text-gray-700">
                📄 {result.detail}
              </p>

            </div>
          )}

        </div>
      </div>

      {/* STYLE SYSTEM */}
      <style jsx>{`

        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.05);
        }

        .input {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: black;
          font-weight: 600;
          font-size: 16px;
          outline: none;
        }

        .input:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 4px rgba(167,139,250,0.25);
        }

        .input-black {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: 2px solid #000;
          background: #000;
          color: #fff;
          font-weight: 900;
          font-size: 16px;
        }

        .input-black::placeholder {
          color: #aaa;
        }

        .input-black:focus {
          box-shadow: 0 0 0 5px rgba(167,139,250,0.35);
        }

        .btn-primary {
          background: #a78bfa;
          color: white;
          font-weight: 800;
          border-radius: 12px;
          padding: 12px 16px;
        }

        .btn-primary:hover {
          background: #8b5cf6;
        }

        .btn-black {
          background: #000;
          color: white;
          font-weight: 800;
          border-radius: 12px;
          padding: 12px 16px;
        }

        .badge-yellow {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .badge-blue {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .badge-green {
          background: #dcfce7;
          color: #166534;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .badge-gray {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 10px;
          border-radius: 999px;
        }

      `}</style>
    </main>
  );
}