"use client";

import { dump, load } from "js-yaml";
import { useEffect, useMemo, useState } from "react";
import { SwaggerViewer } from "@/components/SwaggerViewer";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { validateOpenApiDocument } from "@/lib/openapi";
import { useToast } from "@/lib/toast-context";
import type { OpenApiDocument } from "@/types/openapi";

const defaultSchema = `openapi: 3.0.3
info:
  title: Swagger Petstore Demo
  version: 1.0.0
servers:
  - url: https://petstore.swagger.io/v2
paths:
  /pet/{petId}:
    get:
      summary: Find pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
        - name: api_key
          in: header
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
        '404':
          description: Pet not found
  /pet:
    post:
      summary: Add a new pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: integer
                name:
                  type: string
                status:
                  type: string
              required:
                - name
            example:
              id: 1
              name: doggie
              status: available
      responses:
        '200':
          description: Pet created
`;

type Format = "json" | "yaml";

type ParseState = {
  format: Format;
  document: OpenApiDocument | null;
  error: string | null;
};

function detectAndParse(source: string): ParseState {
  try {
    const parsed = JSON.parse(source) as unknown;
    const validation = validateOpenApiDocument(parsed);

    return {
      format: "json",
      document: validation.valid ? (parsed as OpenApiDocument) : null,
      error: validation.message ?? null
    };
  } catch {
    try {
      const parsed = load(source) as unknown;
      const validation = validateOpenApiDocument(parsed);

      return {
        format: "yaml",
        document: validation.valid ? (parsed as OpenApiDocument) : null,
        error: validation.message ?? null
      };
    } catch (error) {
      return {
        format: "yaml",
        document: null,
        error: error instanceof Error ? error.message : "Unable to parse schema."
      };
    }
  }
}

export function SwaggerWorkspace() {
  const [source, setSource] = useState(defaultSchema);
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const parsed = useMemo(() => detectAndParse(source), [source]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    fetch("/api/schemas")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!active || typeof payload !== "object" || payload === null) {
          return;
        }

        const record = payload as { schema?: unknown };

        if (typeof record.schema === "string" && record.schema.trim().length > 0) {
          setSource(record.schema);
        }
      })
      .catch(() => showToast(t("savedSchemaLoadFailed"), "error"));

    return () => {
      active = false;
    };
  }, [showToast, t, user]);

  const toggleFormat = () => {
    if (!parsed.document) {
      showToast(t("fixSchemaBeforeConvert"), "error");
      return;
    }

    if (parsed.format === "yaml") {
      setSource(JSON.stringify(parsed.document, null, 2));
      return;
    }

    setSource(dump(parsed.document, { noRefs: true, lineWidth: 100 }));
  };

  const saveSchema = async () => {
    if (!parsed.document) {
      showToast(t("schemaOnlyValid"), "error");
      return;
    }

    const response = await fetch("/api/schemas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schema: source })
    });

    if (!response.ok) {
      showToast(t("schemaNotSaved"), "error");
      return;
    }

    showToast(t("saved"), "success");
  };

  return (
    <section className="stack">
      <div className="hero">
        <h1>Swagger/OpenAPI UI</h1>
        <p>{t("mainDescription")}</p>
      </div>

      <div className="workspace">
        <section className="panel" aria-label="Swagger editor">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{t("editor")}</h2>
              <p>{parsed.document ? t("schemaValid") : t("schemaInvalid")}</p>
            </div>

            <div className="panel-actions">
              <span className="status-pill">{parsed.format.toUpperCase()}</span>

              <button className="button" onClick={toggleFormat} type="button">
                JSON ↔ YAML
              </button>

              {user ? (
                <button className="button primary" onClick={saveSchema} type="button">
                  {t("saveSchema")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="panel-body stack">
            <textarea
              className="textarea"
              spellCheck={false}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              aria-label="OpenAPI schema editor"
            />

            <div className="endpoint-summary">
              {parsed.document ? (
                <span className="status-pill success">{t("schemaValid")}</span>
              ) : (
                <span className="status-pill error">{t("schemaInvalid")}</span>
              )}

              {parsed.error ? <span className="error-text">{parsed.error}</span> : null}
            </div>
          </div>
        </section>

        <section className="panel" aria-label="Swagger viewer">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{t("viewer")}</h2>
              <p>{parsed.document ? t("endpointsLoaded") : t("waitingForSchema")}</p>
            </div>

            <span className="status-pill">
              {parsed.document ? t("endpointsLoaded") : t("waitingForSchema")}
            </span>
          </div>

          <div className="panel-body">
            <SwaggerViewer document={parsed.document} />
          </div>
        </section>
      </div>
    </section>
  );
}