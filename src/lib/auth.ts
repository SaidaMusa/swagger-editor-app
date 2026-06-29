import { cookies } from "next/headers";
import crypto from "node:crypto";
import { findUserById, type UserRecord } from "@/lib/db";

export type PublicUser = {
  id: string;
  email: string;
};

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

const cookieName = "swagger_session";
const tokenLifetimeSeconds = 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.AUTH_SECRET ?? "development-secret-change-me";
}

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.sub === "string" &&
    typeof record.email === "string" &&
    typeof record.exp === "number"
  );
}

function createToken(payload: SessionPayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function verifyToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);

  if (Buffer.byteLength(signature) !== Buffer.byteLength(expected)) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as unknown;

    if (!isSessionPayload(payload)) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");
  return `${salt}.${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(".");

  if (!salt || !hash) {
    return false;
  }

  const input = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("base64url");

  if (Buffer.byteLength(hash) !== Buffer.byteLength(input)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(input));
}

export async function createSessionCookie(user: UserRecord): Promise<void> {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + tokenLifetimeSeconds;
  const token = createToken({ sub: user.id, email: user.email, exp });

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: tokenLifetimeSeconds
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await findUserById(payload.sub);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email
  };
}

export function getUserFromRequest(request: Request): PublicUser | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  if (!token) {
    return null;
  }

  const payload = verifyToken(decodeURIComponent(token));

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email
  };
}
