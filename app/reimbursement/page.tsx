"use client";

import { useRouter } from "next/navigation";

export default function ReimbursementPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">IB Reimbursement</h1>
          <p className="text-gray-400 text-sm mt-2">เลือกประเภทการขอเบิกค่าใช้จ่าย</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* เบิก Ads */}
          <button
            onClick={() => router.push("/reimbursement/ads")}
            className="group bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition">
              📢
            </div>
            <h2 className="font-bold text-gray-800 text-base mb-1">เบิกค่า Ads</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              ขอเบิกค่าโฆษณา (Advertising Reimbursement) สำหรับ IB ที่เข้าเกณฑ์ Tier
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:gap-2 transition-all">
              เริ่มกรอกข้อมูล
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </button>

          {/* เบิกของ */}
          <button
            onClick={() => router.push("/reimbursement/merchandise")}
            className="group bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-100 transition">
              🎁
            </div>
            <h2 className="font-bold text-gray-800 text-base mb-1">เบิกของรางวัล</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              ขอเบิกของแจก Merchandise สำหรับ IB ที่เข้าเกณฑ์ตาม Tier
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-2 transition-all">
              เริ่มกรอกข้อมูล
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">SUPPORT TEAMBON VT MARKET</p>
      </div>
    </main>
  );
}
