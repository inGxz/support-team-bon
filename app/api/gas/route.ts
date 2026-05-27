import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyQc-fubbnh57WsugTUeXRnp9afLXDAF8HdXXa34pyM6DMpvZOaOJJljPowuH6POdcs/exec";

// Proxy POST → GAS (แก้ปัญหา CORS เวลาเรียกจาก browser โดยตรง)
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const gasRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
      redirect: "follow",
    });

    const text = await gasRes.text();

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "PROXY_FAILED", message: String(err) },
      { status: 500 }
    );
  }
}

// GET → forward query params to GAS
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search; // "?jobId=...&action=..."
    const gasRes = await fetch(GAS_URL + search, { redirect: "follow" });
    const text = await gasRes.text();

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "PROXY_FAILED", message: String(err) },
      { status: 500 }
    );
  }
}
