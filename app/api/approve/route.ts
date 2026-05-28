import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.GAS_SCRIPT_URL || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, lineUserId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "MISSING_JOB_ID" }, { status: 400 });
    }

    const res  = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approveJob", jobId, lineUserId: lineUserId || "" }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "GAS_ERROR", detail: String(err) }, { status: 500 });
  }
}
