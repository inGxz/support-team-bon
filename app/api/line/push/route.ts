import { NextRequest, NextResponse } from "next/server";

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

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

    let messages: object[];

    if (type === "created") {
      messages = [
        {
          type: "flex",
          altText: `🎉 ส่งงานสำเร็จแล้ว! Job ID: ${jobId}`,
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: "#6366f1",
              contents: [
                {
                  type: "text",
                  text: "🎉 ส่งงานสำเร็จแล้ว!",
                  weight: "bold",
                  size: "xl",
                  color: "#ffffff",
                },
              ],
            },
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: `📋 Job ID: ${jobId}`,
                  size: "sm",
                  color: "#333333",
                  weight: "bold",
                },
                ...(customerName
                  ? [{ type: "text", text: `👤 ลูกค้า: ${customerName}`, size: "sm", color: "#555555" }]
                  : []),
                ...(taskLabel
                  ? [{ type: "text", text: `📦 ประเภทงาน: ${taskLabel}`, size: "sm", color: "#555555", wrap: true }]
                  : []),
                {
                  type: "separator",
                  margin: "md",
                },
                {
                  type: "text",
                  text: "กรุณาเก็บ Job ID ไว้เพื่อติดตามสถานะงาน",
                  size: "xs",
                  color: "#aaaaaa",
                  margin: "md",
                  wrap: true,
                },
                {
                  type: "text",
                  text: "ระบบ SUPPORT TEAMBON VT MARKET",
                  size: "xs",
                  color: "#aaaaaa",
                  wrap: true,
                },
              ],
            },
          },
        },
      ];
    } else {
      messages = [
        {
          type: "text",
          text: body.message || `📢 อัปเดตงาน Job ID: ${jobId}`,
        },
      ];
    }

    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to: userId, messages }),
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
