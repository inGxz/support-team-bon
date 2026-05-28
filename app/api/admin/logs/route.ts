import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL  = process.env.GAS_SCRIPT_URL  || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET   || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return !!ADMIN_PASSWORD && auth === `Bearer ${ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const jobId  = searchParams.get("jobId")  || "";
    const limit  = searchParams.get("limit")  || "200";

    let url = `${SCRIPT_URL}?action=activityLog&adminSecret=${encodeURIComponent(ADMIN_SECRET)}&limit=${limit}`;
    if (jobId) url += `&jobId=${encodeURIComponent(jobId)}`;

    const res  = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "GAS_ERROR", detail: String(err) }, { status: 500 });
  }
}
