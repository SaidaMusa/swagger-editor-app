import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserHistory } from "@/lib/db";
import { getServerT } from "@/lib/i18n-server";

export default async function HistoryPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getServerT()]);

  if (!user) {
    redirect("/");
  }

  const history = await getUserHistory(user.id);

  return (
    <section className="stack">
      <div className="hero">
        <h1>{t("historyTitle")}</h1>
        <p>{t("historyDescription")}</p>
      </div>
      {history.length === 0 ? (
        <div className="card stack">
          <h2>{t("emptyHistoryTitle")}</h2>
          <p>{t("emptyHistoryText")}</p>
          <Link href="/" className="button primary">
            {t("openEditorViewer")}
          </Link>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("timestamp")}</th>
                <th>{t("method")}</th>
                <th>{t("endpointUrl")}</th>
                <th>{t("status")}</th>
                <th>{t("duration")}</th>
                <th>{t("sizes")}</th>
                <th>{t("details")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.requestTimestamp).toLocaleString()}</td>
                  <td>{record.method}</td>
                  <td>
                    <strong>{record.endpoint}</strong>
                    <br />
                    <span className="badge">{record.url}</span>
                  </td>
                  <td>{record.responseStatus}</td>
                  <td>{record.requestDuration} ms</td>
                  <td>
                    {t("request")}: {record.requestSize} B
                    <br />
                    {t("response")}: {record.responseSize} B
                  </td>
                  <td>
                    <Link className="nav-link" href={`/history/${record.id}`}>
                      {t("view")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
