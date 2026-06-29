import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { getCurrentUser } from "@/lib/auth";
import { getServerLanguage } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swagger Editor App",
  description: "OpenAPI editor, viewer, REST client, and request analytics"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, language] = await Promise.all([getCurrentUser(), getServerLanguage()]);

  return (
    <html lang={language}>
      <body>
        <Providers user={user} language={language}>
          <div className="page-shell">
            <Header />
            <main className="main-content">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
