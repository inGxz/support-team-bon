import { NextRequest, NextResponse } from "next/server";

const CHANNEL_ACCESS_TOKEN =
  process.env.LINE_CHANNEL_ACCESS_TOKEN ||
  "DqSGNqsocKnqKCaEcExvPg/onN3k71xJloz7em5Be5AcBN2/x4jE0+uie6o8EAq410shTOdM7CW0UWVd2Zcowv+kOZ4NUS/D+MpaonJOBxCEiqmO/LCg5NkXkJlitv6Pj/mR/3PAnv/T6/BZTmo+hwdB04t89/1O/w1cDnyilFU=";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, jobId, type, customerName, taskLabel } = body;

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "userId and jobId are required" },
        { status: 400 }
      );
    }

    let messageText = "";

    if (type === "created") {
      messageText =
        `🎉 ส่งงานสำเร็จแล้ว!\n\n` +
        `📋 Job ID: ${jobId}\n` +
        (customerName ? `👤 ลูกค้า: ${customerName}\n` : "") +
        (taskLabel ? `📦 ประเภทงาน: ${taskLabel}\n` : "") +
        `\nกรุณาเก็บ Job ID ไว้เพื่อติดตามสถานะงาน\nระบบ SUPPORT TEAMBON VT MARKET`;
    } else if (type === "done") {
      messageText =
        `✅ งานของคุณเสร็จแล้ว!\n\n` +
        `📋 Job ID: ${jobId}\n` +
        (customerName ? `👤 ลูกค้า: ${customerName}\n` : "") +
        `\nกรุณาติดต่อทีมงานเพื่อรับงาน\nระบบ SUPPORT TEAMBON VT MARKET`;
    } else {
      messageText = body.message || `📢 อัปเดตงาน Job ID: ${jobId}`;
    }

    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: messageText }],
      }),
    });

    if (!lineRes.ok) {
      const errText = await lineRes.text();
      console.error("LINE API error:", errText);
      return NextResponse.json(
        { error: "LINE API error", detail: errText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
