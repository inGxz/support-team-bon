import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.GAS_SCRIPT_URL || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return !!ADMIN_PASSWORD && auth === `Bearer ${ADMIN_PASSWORD}`;
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        adminSecret: ADMIN_SECRET,
        jobId: body.jobId,
        status: body.status,
        deliveryLink: body.deliveryLink,
      }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "GAS_ERROR", detail: String(err) }, { status: 500 });
  }
}
