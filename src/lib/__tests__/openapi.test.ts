import { describe, expect, test } from "vitest";
import { getBaseUrl, getEndpoints, validateOpenApiDocument } from "@/lib/openapi";
import type { OpenApiDocument } from "@/types/openapi";

const document: OpenApiDocument = {
  openapi: "3.0.3",
  info: { title: "Demo", version: "1.0.0" },
  servers: [{ url: "https://api.example.com" }],
  paths: {
    "/users/{id}": {
      get: {
        summary: "Get user",
        responses: { "200": { description: "OK" } }
      }
    }
  }
};

describe("openapi helpers", () => {
  test("validates required document shape", () => {
    expect(validateOpenApiDocument(document).valid).toBe(true);
    expect(validateOpenApiDocument({ openapi: "3.0.3", paths: {} }).valid).toBe(false);
  });

  test("extracts endpoints", () => {
    const endpoints = getEndpoints(document);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0]?.id).toBe("GET /users/{id}");
  });

  test("reads server base url", () => {
    expect(getBaseUrl(document)).toBe("https://api.example.com");
  });
});
