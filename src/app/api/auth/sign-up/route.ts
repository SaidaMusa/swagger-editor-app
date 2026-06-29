import { NextResponse } from "next/server";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/db";
import { isValidEmail, safeTrim, validatePassword } from "@/lib/validation";

type AuthRequest = {
  email?: unknown;
  password?: unknown;
};

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AuthRequest;
  const email = typeof payload.email === "string" ? safeTrim(payload.email).toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!isValidEmail(email)) {
    return badRequest("Enter a valid email address.");
  }

  const passwordResult = validatePassword(password);

  if (!passwordResult.valid) {
    return badRequest(passwordResult.reasons.join(" "));
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    return badRequest("User with this email already exists.", 409);
  }

  const user = await createUser(email, hashPassword(password));
  await createSessionCookie(user);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
