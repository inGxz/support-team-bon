import { NextRequest, NextResponse } from "next/server";

// LINE Webhook — รับ events จาก LINE Platform
// ใช้สำหรับจับ Group ID ของ admin group
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      const source = event.source || {};
      if (source.groupId) {
        // log ไว้ดูใน Vercel Function Logs
        console.log("=== LINE GROUP ID ===");
        console.log(source.groupId);
        console.log("====================");
      }
    }

    // ต้องตอบ 200 เสมอ yokถ้า LINE จะ retry
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

// LINE ส่ง GET มาตอน verify webhook
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
