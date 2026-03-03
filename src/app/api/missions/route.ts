import { NextRequest, NextResponse } from "next/server";
import { getAllMissions, createMission, updateMission, deleteMission, getMissionTaskCounts } from "@/lib/db";
import { logActivity } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  const missions = getAllMissions();
  const withCounts = missions.map((m) => ({
    ...m,
    ...getMissionTaskCounts(m.id),
  }));
  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description = "" } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const mission = createMission({
    id: generateId(),
    name,
    description,
    status: "active",
  });

  logActivity({
    type: "mission_created",
    message: `Mission created: "${mission.name}"`,
    task_id: null,
    mission_id: mission.id,
  });

  return NextResponse.json(mission, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Mission ID is required" }, { status: 400 });
  }

  const mission = updateMission(id, updates);
  if (!mission) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  return NextResponse.json(mission);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Mission ID is required" }, { status: 400 });
  }

  const deleted = deleteMission(id);
  if (!deleted) {
    return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  }

  logActivity({
    type: "mission_deleted",
    message: `Mission deleted`,
    task_id: null,
    mission_id: id,
  });

  return NextResponse.json({ success: true });
}
