"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  normalizeLanguage,
  translate,
  type Language,
  type TranslationKey
} from "@/lib/translations";

export type { Language } from "@/lib/translations";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

type I18nProviderProps = {
  children: ReactNode;
  initialLanguage?: Language;
};

const LANGUAGE_KEY = "swagger-language";

const I18nContext = createContext<I18nContextValue | null>(null);

function getLanguageFromCookie(): Language {
  if (typeof document === "undefined") {
    return "en";
  }

  const languageCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LANGUAGE_KEY}=`));

  const languageValue = languageCookie?.split("=")[1];

  return normalizeLanguage(languageValue);
}

function getInitialLanguage(initialLanguage?: Language): Language {
  if (initialLanguage) {
    return initialLanguage;
  }

  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);

  if (storedLanguage === "en" || storedLanguage === "uz") {
    return storedLanguage;
  }

  return getLanguageFromCookie();
}

function saveLanguage(language: Language) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }

  if (typeof document !== "undefined") {
    document.cookie = `${LANGUAGE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
  }
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() =>
    getInitialLanguage(initialLanguage)
  );

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      if (nextLanguage === language) {
        return;
      }

      saveLanguage(nextLanguage);
      setLanguageState(nextLanguage);

      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translate(language, key)
    }),
    [language, setLanguage]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
