"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Language } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";

export function Header() {
  const [compact, setCompact] = useState(false);
  const { user, setUser } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signOut = async () => {
    const response = await fetch("/api/auth/sign-out", { method: "POST" });

    if (!response.ok) {
      showToast(t("unableToSignOut"), "error");
      return;
    }

    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className={`header${compact ? " compact" : ""}`}>
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="Swagger Editor App home">
          <span className="logo-mark">S</span>
          <span>{t("appName")}</span>
        </Link>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/about" className="nav-link">
            {t("about")}
          </Link>
          <select
            className="select"
            aria-label={t("language")}
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="en">English</option>
            <option value="uz">O‘zbek</option>
          </select>
          {user ? (
            <>
              <Link href="/history" className="nav-link">
                {t("history")}
              </Link>
              <button className="button danger" onClick={signOut} type="button">
                {t("signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="nav-link">
                {t("signIn")}
              </Link>
              <Link href="/sign-up" className="button primary">
                {t("signUp")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
