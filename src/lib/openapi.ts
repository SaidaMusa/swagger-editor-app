import type {
  Endpoint,
  HttpMethod,
  JsonValue,
  OpenApiDocument,
  OpenApiSchema,
  ParameterObject,
  PathItemObject
} from "@/types/openapi";

const HTTP_METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete", "options", "head"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  if (!isRecord(value)) {
    return false;
  }

  const hasVersion = typeof value.openapi === "string" || typeof value.swagger === "string";
  const hasPaths = isRecord(value.paths);

  return hasVersion && hasPaths;
}

export function validateOpenApiDocument(value: unknown): { valid: boolean; message?: string } {
  if (!isOpenApiDocument(value)) {
    return {
      valid: false,
      message: "Schema must include openapi/swagger version and a paths object."
    };
  }

  const pathEntries = Object.entries(value.paths);

  if (pathEntries.length === 0) {
    return {
      valid: false,
      message: "Schema paths object cannot be empty."
    };
  }

  for (const [path, item] of pathEntries) {
    if (!path.startsWith("/")) {
      return {
        valid: false,
        message: `Path ${path} must start with /.`
      };
    }

    if (!isRecord(item)) {
      return {
        valid: false,
        message: `Path ${path} must be an object.`
      };
    }
  }

  return { valid: true };
}

function normalizeParameter(value: unknown): ParameterObject | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = value.name;
  const location = value.in;

  if (typeof name !== "string") {
    return null;
  }

  if (
    location !== "path" &&
    location !== "query" &&
    location !== "header" &&
    location !== "cookie"
  ) {
    return null;
  }

  const schema = isRecord(value.schema) ? (value.schema as OpenApiSchema) : undefined;
  const example = isJsonValue(value.example) ? value.example : undefined;

  return {
    name,
    in: location,
    required: typeof value.required === "boolean" ? value.required : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    schema,
    example
  };
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function normalizeParameters(values: unknown): ParameterObject[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(normalizeParameter).filter((value): value is ParameterObject => value !== null);
}

export function getEndpoints(document: OpenApiDocument): Endpoint[] {
  return Object.entries(document.paths).flatMap(([path, item]) => {
    const inheritedParameters = normalizeParameters((item as PathItemObject).parameters);

    return HTTP_METHODS.flatMap((method) => {
      const operation = item[method];

      if (!operation) {
        return [];
      }

      return [
        {
          id: `${method.toUpperCase()} ${path}`,
          path,
          method,
          operation,
          inheritedParameters
        }
      ];
    });
  });
}

export function getBaseUrl(document: OpenApiDocument): string {
  const firstServer = document.servers?.[0]?.url;

  if (firstServer) {
    return firstServer;
  }

  if (document.host) {
    const scheme = document.schemes?.[0] ?? "https";
    return `${scheme}://${document.host}${document.basePath ?? ""}`;
  }

  return "";
}

export function readableSchema(schema: OpenApiSchema | undefined): string {
  if (!schema) {
    return "No schema";
  }

  return JSON.stringify(schema, null, 2);
}

export function getMergedParameters(endpoint: Endpoint): ParameterObject[] {
  const operationParameters = normalizeParameters(endpoint.operation.parameters);
  return [...endpoint.inheritedParameters, ...operationParameters];
}

export function exampleBodyFromSchema(schema: OpenApiSchema | undefined): JsonValue {
  if (!schema) {
    return {};
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.type === "array") {
    return [exampleBodyFromSchema(schema.items)];
  }

  if (schema.type === "object" || schema.properties) {
    const result: Record<string, JsonValue> = {};

    for (const [key, property] of Object.entries(schema.properties ?? {})) {
      result[key] = exampleBodyFromSchema(property);
    }

    return result;
  }

  if (schema.type === "number" || schema.type === "integer") {
    return 0;
  }

  if (schema.type === "boolean") {
    return true;
  }

  return "string";
}
