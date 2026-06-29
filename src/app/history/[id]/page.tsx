import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHistoryItem } from "@/lib/db";
import { getServerT } from "@/lib/i18n-server";

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, t] = await Promise.all([getCurrentUser(), getServerT()]);

  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const record = await getHistoryItem(user.id, id);

  if (!record) {
    notFound();
  }

  return (
    <section className="stack">
      <Link href="/history" className="nav-link">
        {t("backToHistory")}
      </Link>
      <div className="hero">
        <h1>{t("historyDetailTitle")}</h1>
        <p>{record.endpoint}</p>
      </div>
      <div className="grid-two">
        <article className="card stack">
          <h2>{t("request")}</h2>
          <p>
            {t("method")}: {record.method}
          </p>
          <p>URL: {record.url}</p>
          <p>
            {t("timestamp")}: {new Date(record.requestTimestamp).toLocaleString()}
          </p>
          <p>
            {t("request")} size: {record.requestSize} B
          </p>
        </article>
        <article className="card stack">
          <h2>{t("response")}</h2>
          <p>
            {t("status")}: {record.responseStatus}
          </p>
          <p>
            {t("duration")}: {record.requestDuration} ms
          </p>
          <p>
            {t("response")} size: {record.responseSize} B
          </p>
          <p>
            {t("errorDetails")}: {record.errorDetails ?? "None"}
          </p>
        </article>
      </div>
    </section>
  );
}
