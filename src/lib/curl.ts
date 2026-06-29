export type CurlInput = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};

function quoteShell(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function generateCurl(input: CurlInput): string {
  const method = input.method.toUpperCase();
  const parts: string[] = ["curl", "-X", quoteShell(method), quoteShell(input.url)];

  for (const [key, value] of Object.entries(input.headers)) {
    if (value.trim().length > 0) {
      parts.push("-H", quoteShell(`${key}: ${value}`));
    }
  }

  if (input.body && input.body.trim().length > 0 && method !== "GET" && method !== "HEAD") {
    parts.push("--data", quoteShell(input.body));
  }

  return parts.join(" ");
}
