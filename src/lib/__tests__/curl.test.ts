import { describe, expect, test } from "vitest";
import { generateCurl } from "@/lib/curl";

describe("generateCurl", () => {
  test("creates cURL command with method headers and body", () => {
    const command = generateCurl({
      url: "https://api.example.com/users",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"John"}'
    });

    expect(command).toContain("curl");
    expect(command).toContain("-X 'POST'");
    expect(command).toContain("-H 'Content-Type: application/json'");
    expect(command).toContain("--data");
  });

  test("does not attach body for GET requests", () => {
    expect(
      generateCurl({ url: "https://api.example.com", method: "GET", headers: {}, body: "x" })
    ).not.toContain("--data");
  });
});
