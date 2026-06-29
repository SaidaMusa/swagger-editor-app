"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>{t("footerText")}</span>
        <Link href="/about" className="nav-link">
          {t("about")}
        </Link>
      </div>
    </footer>
  );
}
