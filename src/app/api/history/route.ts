import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserHistory } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await getUserHistory(user.id);
  return NextResponse.json({ history });
}
