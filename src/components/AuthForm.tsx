"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, type ClientUser } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import { isValidEmail, validatePassword } from "@/lib/validation";

type AuthMode = "sign-in" | "sign-up";

type AuthSuccess = {
  user: ClientUser;
};

type AuthFailure = {
  error: string;
};

function isAuthSuccess(value: unknown): value is AuthSuccess {
  if (typeof value !== "object" || value === null || !("user" in value)) {
    return false;
  }

  const user = (value as { user?: unknown }).user;

  if (typeof user !== "object" || user === null) {
    return false;
  }

  const record = user as { id?: unknown; email?: unknown };
  return typeof record.id === "string" && typeof record.email === "string";
}

function isAuthFailure(value: unknown): value is AuthFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: unknown }).error === "string"
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const title = mode === "sign-in" ? t("signIn") : t("signUp");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: string[] = [];

    if (!isValidEmail(email)) {
      nextErrors.push(t("enterValidEmail"));
    }

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {
      nextErrors.push(...passwordResult.reasons);
    }

    setErrors(nextErrors);

    if (nextErrors.length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok || isAuthFailure(payload)) {
        setErrors([isAuthFailure(payload) ? payload.error : t("authFailed")]);
        return;
      }

      if (isAuthSuccess(payload)) {
        setUser(payload.user);
        router.push("/");
        router.refresh();
      }
    } catch {
      showToast(t("authRequestFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card auth-card stack">
      <h1>{title}</h1>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">{t("email")}</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t("password")}</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {errors.length > 0 ? (
          <div className="card" role="alert">
            {errors.map((error) => (
              <p className="error-text" key={error}>
                {error}
              </p>
            ))}
          </div>
        ) : null}
        <button className="button primary" disabled={loading} type="submit">
          {loading ? t("pleaseWait") : title}
        </button>
      </form>
    </section>
  );
}
