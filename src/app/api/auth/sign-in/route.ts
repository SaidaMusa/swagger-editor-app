import { NextResponse } from "next/server";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db";
import { isValidEmail, safeTrim, validatePassword } from "@/lib/validation";

type AuthRequest = {
  email?: unknown;
  password?: unknown;
};

function unauthorized(error: string) {
  return NextResponse.json({ error }, { status: 401 });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AuthRequest;
  const email = typeof payload.email === "string" ? safeTrim(payload.email).toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!isValidEmail(email) || !validatePassword(password).valid) {
    return unauthorized("Invalid email or password.");
  }

  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return unauthorized("Invalid email or password.");
  }

  await createSessionCookie(user);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
