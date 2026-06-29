import { getServerT } from "@/lib/i18n-server";

const teamMembers = [
  {
    name: "Saida Musaxonova",
    roleKey: "soloDeveloper" as const,
    github: "https://github.com/SaidaMusa"
  }
];

export default async function AboutPage() {
  const t = await getServerT();

  return (
    <section className="stack">
      <div className="hero">
        <h1>{t("aboutTitle")}</h1>
        <p>{t("aboutProjectText")}</p>
      </div>

      <div className="grid-two">
        <article className="card stack">
          <h2>{t("aboutCourseTitle")}</h2>
          <p>{t("aboutCourseText")}</p>
        </article>

        <article className="card stack">
          <h2>{t("technologiesTitle")}</h2>
          <p>{t("technologiesText")}</p>
        </article>
      </div>

      <section className="card stack">
        <h2>{t("teamTitle")}</h2>

        <div className="grid-two">
          {teamMembers.map((member) => (
            <article className="card stack" key={member.github}>
              <h3>{member.name}</h3>
              <p>
                {t("role")}: {t(member.roleKey)}
              </p>

              <a className="nav-link" href={member.github} rel="noreferrer" target="_blank">
                {t("github")}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2>{t("resourcesTitle")}</h2>

        <a
          className="nav-link"
          href="https://spec.openapis.org/oas/latest.html"
          rel="noreferrer"
          target="_blank"
        >
          {t("openApiSpec")}
        </a>

        <a
          className="nav-link"
          href="https://swagger.io/tools/swagger-ui/"
          rel="noreferrer"
          target="_blank"
        >
          {t("swaggerUiInspiration")}
        </a>
      </section>
    </section>
  );
}
