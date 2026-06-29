import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addHistory } from "@/lib/db";

type ProxyRequest = {
  url?: unknown;
  method?: unknown;
  headers?: unknown;
  body?: unknown;
  endpoint?: unknown;
};

function isHeaderRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, item]) => typeof key === "string" && typeof item === "string"
    )
  );
}

function byteSize(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function serializeHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === "localhost" || host === "0.0.0.0" || host === "127.0.0.1" || host === "::1") {
    return true;
  }

  if (host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")) {
    return true;
  }

  const parts = host.split(".").map(Number);

  if (parts.length === 4 && parts.every((part) => Number.isInteger(part))) {
    const [first, second] = parts;
    return first === 172 && second >= 16 && second <= 31;
  }

  return false;
}

function validateUrl(value: string): URL | null {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (isPrivateHostname(url.hostname)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ProxyRequest;
  const urlText = typeof payload.url === "string" ? payload.url : "";
  const method = typeof payload.method === "string" ? payload.method.toUpperCase() : "GET";
  const headers = isHeaderRecord(payload.headers) ? payload.headers : {};
  const body = typeof payload.body === "string" ? payload.body : undefined;
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint : urlText;
  const url = validateUrl(urlText);

  if (!url) {
    return NextResponse.json(
      { error: "Only public http and https URLs can be requested." },
      { status: 400 }
    );
  }

  const hasBody = method !== "GET" && method !== "HEAD" && body !== undefined;
  const started = performance.now();
  const timestamp = new Date().toISOString();

  try {
    const upstream = await fetch(url, {
      method,
      headers,
      body: hasBody ? body : undefined,
      redirect: "manual"
    });
    const responseBody = await upstream.text();
    const duration = performance.now() - started;
    const responseHeaders = serializeHeaders(upstream.headers);
    const user = await getCurrentUser();

    if (user) {
      await addHistory({
        id: randomUUID(),
        userId: user.id,
        method,
        endpoint,
        url: url.toString(),
        responseStatus: upstream.status,
        requestTimestamp: timestamp,
        requestDuration: Math.round(duration),
        requestSize: byteSize(JSON.stringify({ headers, body: body ?? "" })),
        responseSize: byteSize(responseBody),
        errorDetails: upstream.ok ? undefined : upstream.statusText
      });
    }

    return NextResponse.json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration
    });
  } catch (error) {
    const duration = performance.now() - started;
    const user = await getCurrentUser();
    const message = error instanceof Error ? error.message : "Request failed";

    if (user) {
      await addHistory({
        id: randomUUID(),
        userId: user.id,
        method,
        endpoint,
        url: url.toString(),
        responseStatus: 0,
        requestTimestamp: timestamp,
        requestDuration: Math.round(duration),
        requestSize: byteSize(JSON.stringify({ headers, body: body ?? "" })),
        responseSize: 0,
        errorDetails: message
      });
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
