"use client";

import { AuthProvider, type ClientUser } from "@/lib/auth-context";
import { I18nProvider, type Language } from "@/lib/i18n";
import { ToastProvider } from "@/lib/toast-context";

export function Providers({
  children,
  user,
  language
}: {
  children: React.ReactNode;
  user: ClientUser | null;
  language: Language;
}) {
  return (
    <AuthProvider initialUser={user}>
      <I18nProvider initialLanguage={language}>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
