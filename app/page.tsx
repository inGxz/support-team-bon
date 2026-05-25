"use client";

import { useState } from "react";

export default function Home() {

  const [taskType, setTaskType] = useState("");
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [reference, setReference] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const tasks = [
    {
      title: "Graphic Banner Campaign",
      id: "STB-001",
      status: "In Progress",
      progress: "70%",
      color: "from-yellow-400 to-orange-400",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      width: "w-[70%]",
    },
    {
      title: "TikTok Video Ads",
      id: "STB-002",
      status: "Review",
      progress: "90%",
      color: "from-blue-400 to-cyan-400",
      bg: "bg-blue-100",
      text: "text-blue-600",
      width: "w-[90%]",
    },
    {
      title: "Outdoor Shooting",
      id: "STB-003",
      status: "Completed",
      progress: "100%",
      color: "from-green-400 to-emerald-400",
      bg: "bg-green-100",
      text: "text-green-600",
      width: "w-full",
    },
  ];

  const cards = [
    {
      title: "Graphic Design",
      desc: "ส่งบรีฟงานออกแบบกราฟิก",
      icon: "🎨",
    },
    {
      title: "Video Editing",
      desc: "ส่งงานตัดต่อวิดีโอ",
      icon: "🎬",
    },
    {
      title: "Ads Management",
      desc: "ส่งบรีฟยิงแอด",
      icon: "📢",
    },
    {
      title: "Content Writing",
      desc: "ส่งบรีฟงานเขียนคอนเทนต์",
      icon: "✍️",
    },
    {
      title: "Outdoor Shooting",
      desc: "ส่งงานถ่ายนอกสถานที่",
      icon: "📸",
    },
    {
      title: "Others",
      desc: "งานอื่นๆเพิ่มเติม",
      icon: "💻",
    },
  ];

  const submitTask = async () => {

    if (!name || !deadline || !detail) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbySBkcCoZjh6p4ac-iw7Hblz9qFk8GwG6Kb1NljIaPTBuLyTl7OKM11IxlCaxPkdXdpzg/exec",
        {
          method: "POST",
          body: JSON.stringify({
            taskType,
            name,
            deadline,
            reference,
            detail,
          }),
        }
      );

      const data = await response.json();

      alert("ส่งงานสำเร็จ 🎉 Job ID: " + data.jobId);

      setTaskType("");
      setName("");
      setDeadline("");
      setReference("");
      setDetail("");

    } catch (error) {

      alert("เกิดข้อผิดพลาด");

    } finally {

      setLoading(false);

    }

  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-gray-800 p-8">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>
            <h1 className="text-5xl font-bold">
              Support Team{" "}
              <span className="text-purple-500">
                Bon
              </span>
            </h1>

            <p className="text-gray-500 text-xl mt-4">
              ระบบส่งงาน Marketing และ Production
            </p>

            <p className="text-gray-400 mt-2">
              จัดการงานทั้งหมดได้ในที่เดียว
            </p>
          </div>

          <button className="border-2 border-[#06C755] text-[#06C755] px-8 py-3 rounded-full font-bold flex items-center gap-3 hover:bg-[#06C755] hover:text-white transition-all duration-300">

            <div className="bg-[#06C755] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
              LINE
            </div>

            Login LINE

          </button>

        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-14">

          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition"
            >

              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl">
                {card.icon}
              </div>

              <h2 className="text-3xl font-bold mt-6">
                {card.title}
              </h2>

              <p className="text-gray-500 mt-3 text-lg">
                {card.desc}
              </p>

              <button
                onClick={() => {

                  setTaskType(card.title);
                  setName(card.title);

                  window.scrollTo({
                    top: 1000,
                    behavior: "smooth",
                  });

                }}
                className="mt-8 border border-gray-200 w-full py-3 rounded-2xl font-semibold hover:bg-gray-50 transition"
              >
                Create Task →
              </button>

            </div>
          ))}

        </div>

        {/* CREATE TASK */}
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 mt-16">

          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">

            <div>
              <h2 className="text-4xl font-bold">
                Create New Task
              </h2>

              {taskType && (
                <div className="mt-4 inline-block bg-purple-100 text-purple-600 px-5 py-2 rounded-2xl font-semibold">
                  {taskType}
                </div>
              )}

              <p className="text-gray-400 mt-4">
                กรุณากรอกรายละเอียดงานให้ครบถ้วน
              </p>
            </div>

            <div className="bg-purple-50 text-purple-500 px-5 py-3 rounded-2xl">
              ℹ️ New Request
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <label className="block mb-2 font-medium">
                ชื่องาน
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-purple-400"
                placeholder="ระบุชื่องาน"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Deadline
              </label>

              <input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-purple-400"
                placeholder="วว/ดด/ปป"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                Reference Link
              </label>

              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none focus:border-purple-400"
                placeholder="แนบ Google Drive หรือ URL"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-medium">
                รายละเอียดงาน
              </label>

              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 outline-none min-h-[180px] focus:border-purple-400"
                placeholder="อธิบายรายละเอียดงาน"
              />
            </div>

          </div>

          <button
            onClick={submitTask}
            className="mt-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:scale-105 transition"
          >
            {loading ? "Loading..." : "🚀 Submit Task"}
          </button>

        </div>

        {/* TRACKING */}
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 mt-16">

          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">

            <div>
              <h2 className="text-4xl font-bold">
                Task Tracking
              </h2>

              <p className="text-gray-400 mt-2">
                ติดตามสถานะงานทั้งหมด
              </p>
            </div>

            <div className="bg-green-50 text-green-500 px-5 py-3 rounded-2xl">
              ● Live Status
            </div>

          </div>

          <div className="space-y-6">

            {tasks.map((task, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-3xl p-6 hover:shadow-md transition"
              >

                <div className="flex items-center justify-between flex-wrap gap-4">

                  <div>
                    <h3 className="text-2xl font-bold">
                      {task.title}
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Job ID: {task.id}
                    </p>
                  </div>

                  <div className={`${task.bg} ${task.text} px-5 py-2 rounded-2xl font-semibold`}>
                    {task.status}
                  </div>

                </div>

                <div className="w-full bg-gray-100 h-4 rounded-full mt-6 overflow-hidden">

                  <div
                    className={`bg-gradient-to-r ${task.color} h-full rounded-full ${task.width}`}
                  ></div>

                </div>

                <div className="flex justify-between mt-3 text-sm text-gray-400">
                  <span>Started</span>
                  <span>{task.progress}</span>
                </div>

              </div>
            ))}

          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center text-gray-400 mt-10">
          💜 Support Team Bon — Marketing Workflow System
        </div>

      </div>

    </main>
  );
}