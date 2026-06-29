"use client";

import { useMemo, useState } from "react";
import { generateCurl } from "@/lib/curl";
import {
  exampleBodyFromSchema,
  getBaseUrl,
  getEndpoints,
  getMergedParameters,
  readableSchema
} from "@/lib/openapi";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast-context";
import type {
  Endpoint,
  MediaTypeObject,
  OpenApiDocument,
  ParameterObject,
  ProxyResponsePayload
} from "@/types/openapi";

type ParamValues = Record<string, string>;

type ExecutePayload = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  endpoint: string;
};

type ProxyJson = ProxyResponsePayload | { error: string };

function firstContent(
  content: Record<string, MediaTypeObject> | undefined
): MediaTypeObject | null {
  if (!content) {
    return null;
  }

  return Object.values(content)[0] ?? null;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function parameterKey(parameter: ParameterObject): string {
  return `${parameter.in}:${parameter.name}`;
}

function buildUrl(
  baseUrl: string,
  path: string,
  parameters: ParameterObject[],
  values: ParamValues
): string {
  let targetPath = path;
  const query = new URLSearchParams();

  for (const parameter of parameters) {
    const value = values[parameterKey(parameter)] ?? "";

    if (parameter.in === "path") {
      targetPath = targetPath.replace(`{${parameter.name}}`, encodeURIComponent(value));
    }

    if (parameter.in === "query" && value.trim().length > 0) {
      query.set(parameter.name, value);
    }
  }

  const normalizedBase = baseUrl.replace(/\/$/u, "");
  const queryString = query.toString();
  return `${normalizedBase}${targetPath}${queryString ? `?${queryString}` : ""}`;
}

function buildHeaders(parameters: ParameterObject[], values: ParamValues): Record<string, string> {
  const headers: Record<string, string> = {};
  const cookies: string[] = [];

  for (const parameter of parameters) {
    const value = values[parameterKey(parameter)] ?? "";

    if (value.trim().length === 0) {
      continue;
    }

    if (parameter.in === "header") {
      headers[parameter.name] = value;
    }

    if (parameter.in === "cookie") {
      cookies.push(`${parameter.name}=${encodeURIComponent(value)}`);
    }
  }

  if (cookies.length > 0) {
    headers.Cookie = cookies.join("; ");
  }

  return headers;
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const parameters = getMergedParameters(endpoint);
  const bodyContent = firstContent(endpoint.operation.requestBody?.content);
  const initialBody = bodyContent?.example
    ? stringifyJson(bodyContent.example)
    : stringifyJson(exampleBodyFromSchema(bodyContent?.schema));
  const [paramValues, setParamValues] = useState<ParamValues>({});
  const [body, setBody] = useState(initialBody);
  const [customBaseUrl, setCustomBaseUrl] = useState(baseUrl);
  const [response, setResponse] = useState<ProxyResponsePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [curlCommand, setCurlCommand] = useState("");
  const { t } = useI18n();
  const { showToast } = useToast();

  const currentRequest = (): ExecutePayload => {
    const headers = buildHeaders(parameters, paramValues);
    const hasBody = endpoint.method !== "get" && endpoint.method !== "head";
    const url = buildUrl(customBaseUrl, endpoint.path, parameters, paramValues);

    if (hasBody && body.trim().length > 0) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }

    return {
      url,
      method: endpoint.method.toUpperCase(),
      headers,
      body: hasBody ? body : undefined,
      endpoint: endpoint.id
    };
  };

  const execute = async () => {
    const payload = currentRequest();
    setLoading(true);
    setResponse(null);

    try {
      const result = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = (await result.json()) as ProxyJson;

      if (!result.ok || "error" in json) {
        showToast(t("requestCouldNotExecute"), "error");
        return;
      }

      setResponse(json);
    } catch {
      showToast(t("networkError"), "error");
    } finally {
      setLoading(false);
    }
  };

  const makeCurl = async () => {
    const request = currentRequest();
    const command = generateCurl(request);
    setCurlCommand(command);

    try {
      await navigator.clipboard.writeText(command);
      showToast(t("curlCopied"));
    } catch {
      showToast(t("clipboardUnavailable"), "error");
    }
  };

  return (
    <details className="endpoint">
      <summary>
        <span className="method">{endpoint.method}</span>
        <strong>{endpoint.path}</strong>
        <span>{endpoint.operation.summary ?? endpoint.operation.operationId ?? t("endpoint")}</span>
      </summary>
      <div className="endpoint-body">
        {endpoint.operation.description ? <p>{endpoint.operation.description}</p> : null}
        <div className="field">
          <label htmlFor={`${endpoint.id}-base`}>{t("baseUrl")}</label>
          <input
            id={`${endpoint.id}-base`}
            className="input"
            value={customBaseUrl}
            onChange={(event) => setCustomBaseUrl(event.target.value)}
            placeholder="https://api.example.com"
          />
        </div>
        <section className="stack">
          <h3>{t("parameters")}</h3>
          {parameters.length === 0 ? <p className="badge">{t("noParameters")}</p> : null}
          <div className="grid-two">
            {parameters.map((parameter) => (
              <div className="field" key={parameterKey(parameter)}>
                <label htmlFor={`${endpoint.id}-${parameterKey(parameter)}`}>
                  {parameter.name} · {parameter.in}
                  {parameter.required ? " · required" : ""}
                </label>
                <input
                  id={`${endpoint.id}-${parameterKey(parameter)}`}
                  className="input"
                  value={paramValues[parameterKey(parameter)] ?? ""}
                  onChange={(event) =>
                    setParamValues((values) => ({
                      ...values,
                      [parameterKey(parameter)]: event.target.value
                    }))
                  }
                  placeholder={parameter.description ?? parameter.schema?.type ?? "value"}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="grid-two">
          <div className="stack">
            <h3>{t("requestBody")}</h3>
            <pre className="code-block">{readableSchema(bodyContent?.schema)}</pre>
            <textarea
              className="textarea"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <div className="stack">
            <h3>{t("responses")}</h3>
            {Object.entries(endpoint.operation.responses ?? {}).map(([status, details]) => (
              <div className="card" key={status}>
                <strong>{status}</strong>
                <p>{details.description ?? t("noSchema")}</p>
                <pre className="code-block">
                  {readableSchema(firstContent(details.content)?.schema)}
                </pre>
              </div>
            ))}
          </div>
        </section>
        <div className="nav">
          <button className="button primary" onClick={execute} type="button" disabled={loading}>
            {loading ? t("executing") : t("execute")}
          </button>
          <button className="button" onClick={makeCurl} type="button">
            {t("generateCurl")}
          </button>
        </div>
        {curlCommand ? <pre className="code-block">{curlCommand}</pre> : null}
        {response ? (
          <section className="stack">
            <h3>{t("response")}</h3>
            <span className="badge">
              {t("status")}: {response.status}
            </span>
            <span className="badge">
              {t("duration")}: {Math.round(response.duration)} ms
            </span>
            <pre className="code-block">{stringifyJson(response.headers)}</pre>
            <pre className="code-block">{response.body}</pre>
          </section>
        ) : null}
      </div>
    </details>
  );
}

export function SwaggerViewer({ document }: { document: OpenApiDocument | null }) {
  const { t } = useI18n();
  const endpoints = useMemo(() => (document ? getEndpoints(document) : []), [document]);
  const baseUrl = document ? getBaseUrl(document) : "";

  if (!document) {
    return (
      <div className="viewer-list">
        <p className="error-text">{t("schemaNotLoaded")}</p>
      </div>
    );
  }

  return (
    <div className="viewer-list">
      {endpoints.length === 0 ? <p>{t("noEndpoints")}</p> : null}
      {endpoints.map((endpoint) => (
        <EndpointCard key={endpoint.id} endpoint={endpoint} baseUrl={baseUrl} />
      ))}
    </div>
  );
}
