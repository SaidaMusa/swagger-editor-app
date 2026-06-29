import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSavedSchema, saveSchema } from "@/lib/db";

type SaveSchemaRequest = {
  schema?: unknown;
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schema = await getSavedSchema(user.id);
  return NextResponse.json({ schema });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as SaveSchemaRequest;

  if (typeof payload.schema !== "string") {
    return NextResponse.json({ error: "Schema must be a string." }, { status: 400 });
  }

  await saveSchema(user.id, payload.schema);
  return NextResponse.json({ ok: true });
}
