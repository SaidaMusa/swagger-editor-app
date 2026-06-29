export type PasswordValidation = {
  valid: boolean;
  reasons: string[];
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim());
}

export function validatePassword(password: string): PasswordValidation {
  const reasons: string[] = [];

  if (password.length < 8) {
    reasons.push("Password must contain at least 8 characters.");
  }

  if (!/\p{L}/u.test(password)) {
    reasons.push("Password must contain at least one letter.");
  }

  if (!/\p{N}/u.test(password)) {
    reasons.push("Password must contain at least one digit.");
  }

  if (!/[^\p{L}\p{N}]/u.test(password)) {
    reasons.push("Password must contain at least one special character.");
  }

  return {
    valid: reasons.length === 0,
    reasons
  };
}

export function safeTrim(value: string): string {
  return value.trim();
}
