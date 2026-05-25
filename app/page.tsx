"use client";

import { useEffect, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbySBkcCoZjh6p4ac-iw7Hblz9qFk8GwG6Kb1NljIaPTBuLyTl7OKM11IxlCaxPkdXdpzg/exec";

const LINE_LOGIN_URL =
  "https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2010190087&redirect_uri=https://support-team-bon.vercel.app/auth/callback&state=12345&scope=profile%20openid%20email";

export default function Home() {

  const [user, setUser] = useState<any>(null);

  const [customerName, setCustomerName] = useState("");
  const [taskType, setTaskType] = useState("");
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reference, setReference] = useState("");
  const [detail, setDetail] = useState("");

  const [tasks, setTasks] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  // LOAD USER
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // LOAD TASKS
  const loadTasks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data.reverse() : []);
    } catch (err) {
      console.log("Load error:", err);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // CREATE TASK
  const submitTask = async () => {

    if (!name || !deadline || !detail) {
      alert("กรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          customerName: user?.name || customerName,
          taskType,
          name,
          deadline,
          reference,
          detail,
        }),
      });

      const data = await res.json();

      alert("สร้างงานสำเร็จ 🎉 Job ID: " + data.jobId);

      setName("");
      setDeadline("");
      setReference("");
      setDetail("");

      loadTasks();

    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }

    setLoading(false);
  };

  // SEARCH
  const searchTask = () => {

    const found = tasks.find(
      (t) =>
        (t.jobId || "").toString().trim().toLowerCase() ===
        searchId.toString().trim().toLowerCase()
    );

    if (!found) {
      alert("ไม่พบ Job ID");
      setSearchResult(null);
      return;
    }

    setSearchResult(found);
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] p-8 text-gray-800">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">

          <div>
            <h1 className="text-4xl font-bold">
              Support Team Bon
            </h1>

            {user && (
              <p className="text-green-600 mt-2">
                👤 {user.name}
              </p>
            )}
          </div>

          {/* LINE LOGIN BUTTON */}
          <button
            onClick={() => (window.location.href = LINE_LOGIN_URL)}
            className="border-2 border-[#06C755] text-[#06C755] px-6 py-2 rounded-full font-bold hover:bg-[#06C755] hover:text-white transition"
          >
            LINE Login
          </button>

        </div>

        {/* TASK TYPE */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">

          {["Graphic", "Video", "Ads", "Content", "Shoot"].map((t) => (
            <button
              key={t}
              onClick={() => setTaskType(t)}
              className={`p-3 rounded-xl border ${
                taskType === t ? "bg-purple-500 text-white" : "bg-white"
              }`}
            >
              {t}
            </button>
          ))}

        </div>

        {/* FORM */}
        <div className="bg-white p-6 rounded-xl shadow">

          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border p-3 mb-3 rounded"
            placeholder="ชื่อผู้สั่ง (ถ้าไม่ได้ Login)"
          />

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-3 mb-3 rounded"
            placeholder="ชื่องาน"
          />

          <input
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border p-3 mb-3 rounded"
            placeholder="Deadline"
          />

          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full border p-3 mb-3 rounded"
            placeholder="Reference"
          />

          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full border p-3 mb-3 rounded"
            placeholder="รายละเอียดงาน"
          />

          <button
            onClick={submitTask}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl w-full"
          >
            {loading ? "Loading..." : "Submit Task"}
          </button>

        </div>

        {/* SEARCH */}
        <div className="bg-white p-6 mt-10 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-3">
            Search Job ID
          </h2>

          <div className="flex gap-2">

            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="border p-3 w-full rounded"
              placeholder="STB-001"
            />

            <button
              onClick={searchTask}
              className="bg-black text-white px-4 rounded"
            >
              Search
            </button>

          </div>

          {searchResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded">

              <div className="font-bold">{searchResult.name}</div>
              <div>{searchResult.jobId}</div>
              <div>{searchResult.customerName}</div>

              <div className="text-purple-600 font-bold">
                {searchResult.status}
              </div>

            </div>
          )}

        </div>

        {/* TRACKING */}
        <div className="bg-white p-6 mt-10 rounded-xl shadow">

          <h2 className="text-xl font-bold mb-5">
            Task Tracking
          </h2>

          {tasks.map((t, i) => (
            <div key={i} className="border p-4 mb-3 rounded-xl">

              <div className="font-bold">{t.name}</div>
              <div>{t.jobId}</div>
              <div className="text-gray-500">{t.customerName}</div>

              <div>{t.taskType}</div>

              <div className="text-purple-600 font-bold">
                {t.status}
              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  );
}