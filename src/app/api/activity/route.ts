import { NextRequest, NextResponse } from "next/server";
import { getActivityLog } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const activity = getActivityLog(limit);
  return NextResponse.json(activity);
}
