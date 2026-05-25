"use client";

import { useEffect, useState } from "react";

export default function Home() {

  // FORM STATE
  const [taskType, setTaskType] = useState("");
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reference, setReference] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  // TRACKING DATA
  const [tasks, setTasks] = useState<any[]>([]);

  // SEARCH
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);

  // SERVICE CARDS
  const cards = [
    { title: "Graphic Design", icon: "🎨", desc: "งานกราฟิก" },
    { title: "Video Editing", icon: "🎬", desc: "ตัดต่อวิดีโอ" },
    { title: "Ads Management", icon: "📢", desc: "ยิงแอด" },
    { title: "Content Writing", icon: "✍️", desc: "เขียนคอนเทนต์" },
    { title: "Outdoor Shooting", icon: "📸", desc: "ถ่ายนอกสถานที่" },
  ];

  // LOAD TASKS FROM SHEET
  useEffect(() => {

    fetch("https://script.google.com/macros/s/AKfycbySBkcCoZjh6p4ac-iw7Hblz9qFk8GwG6Kb1NljIaPTBuLyTl7OKM11IxlCaxPkdXdpzg/exec")
      .then(res => res.json())
      .then(data => setTasks(data.reverse()));

  }, []);

  // SUBMIT TASK
  const submitTask = async () => {

    if (!name || !deadline || !detail) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbySBkcCoZjh6p4ac-iw7Hblz9qFk8GwG6Kb1NljIaPTBuLyTl7OKM11IxlCaxPkdXdpzg/exec",
        {
          method: "POST",
          body: JSON.stringify({
            taskType,
            name,
            deadline,
            reference,
            detail
          }),
        }
      );

      const data = await res.json();

      alert("ส่งงานสำเร็จ 🎉 Job ID: " + data.jobId);

      setTaskType("");
      setName("");
      setDeadline("");
      setReference("");
      setDetail("");

      // refresh tasks
      const refresh = await fetch(
        "https://script.google.com/macros/s/AKfycbySBkcCoZjh6p4ac-iw7Hblz9qFk8GwG6Kb1NljIaPTBuLyTl7OKM11IxlCaxPkdXdpzg/exec"
      );

      const newData = await refresh.json();
      setTasks(newData.reverse());

    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }

    setLoading(false);
  };

  // SEARCH JOB
  const searchTask = () => {

    const found = tasks.find((t) => t.jobId === searchId);

    if (!found) {
      alert("ไม่พบ Job ID นี้");
      setSearchResult(null);
      return;
    }

    setSearchResult(found);

  };

  return (
    <main className="min-h-screen bg-gray-100 p-10 text-gray-800">

      <h1 className="text-4xl font-bold mb-10">
        Support Team Bon
      </h1>

      {/* SERVICE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">

        {cards.map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow">

            <div className="text-3xl">{c.icon}</div>

            <h2 className="font-bold mt-2">{c.title}</h2>

            <p className="text-sm text-gray-500">{c.desc}</p>

            <button
              onClick={() => {
                setTaskType(c.title);
                window.scrollTo({ top: 800, behavior: "smooth" });
              }}
              className="mt-3 text-blue-500"
            >
              Create Task →
            </button>

          </div>
        ))}

      </div>

      {/* FORM */}
      <div className="bg-white p-8 mt-10 rounded-xl">

        <h2 className="text-2xl font-bold mb-5">
          Create Task {taskType && `(${taskType})`}
        </h2>

        <input
          className="border p-3 w-full mb-3"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-3 w-full mb-3"
          placeholder="Deadline"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <input
          className="border p-3 w-full mb-3"
          placeholder="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <textarea
          className="border p-3 w-full mb-3"
          placeholder="Detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />

        <button
          onClick={submitTask}
          className="bg-purple-600 text-white px-6 py-3 rounded"
        >
          {loading ? "Loading..." : "Submit Task"}
        </button>

      </div>

      {/* SEARCH */}
      <div className="bg-white p-8 mt-10 rounded-xl">

        <h2 className="text-2xl font-bold mb-3">
          Search Job ID
        </h2>

        <div className="flex gap-3">

          <input
            className="border p-3 w-full"
            placeholder="STB-xxxxx"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />

          <button
            onClick={searchTask}
            className="bg-black text-white px-5"
          >
            Search
          </button>

        </div>

        {searchResult && (
          <div className="mt-5 p-4 bg-gray-50 rounded">

            <p><b>{searchResult.name}</b></p>
            <p>{searchResult.jobId}</p>
            <p>{searchResult.taskType}</p>

            <span className="bg-purple-200 px-3 py-1 rounded">
              {searchResult.status}
            </span>

          </div>
        )}

      </div>

      {/* TRACKING */}
      <div className="bg-white p-8 mt-10 rounded-xl">

        <h2 className="text-2xl font-bold mb-5">
          Task Tracking
        </h2>

        {tasks.map((t, i) => (
          <div key={i} className="border p-4 mb-3 rounded">

            <b>{t.name}</b>
            <p>{t.jobId}</p>
            <p>{t.taskType}</p>

            <span className="text-purple-600">
              {t.status}
            </span>

          </div>
        ))}

      </div>

    </main>
  );
}