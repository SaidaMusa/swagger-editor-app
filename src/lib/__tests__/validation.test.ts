import { describe, expect, test } from "vitest";
import { isValidEmail, validatePassword } from "@/lib/validation";

describe("validation", () => {
  test("validates email format", () => {
    expect(isValidEmail("student@example.com")).toBe(true);
    expect(isValidEmail("wrong-email")).toBe(false);
  });

  test("validates unicode password requirements", () => {
    expect(validatePassword("Парол1!").valid).toBe(false);
    expect(validatePassword("Пароль123!").valid).toBe(true);
    expect(validatePassword("password").valid).toBe(false);
  });
});
