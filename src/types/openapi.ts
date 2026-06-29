export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type ParameterLocation = "path" | "query" | "header" | "cookie";
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

export type OpenApiSchema = {
  type?: string;
  format?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: JsonValue[];
  example?: JsonValue;
  default?: JsonValue;
  description?: string;
  $ref?: string;
};

export type OpenApiExample = {
  summary?: string;
  description?: string;
  value?: JsonValue;
};

export type MediaTypeObject = {
  schema?: OpenApiSchema;
  example?: JsonValue;
  examples?: Record<string, OpenApiExample>;
};

export type RequestBodyObject = {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaTypeObject>;
};

export type ResponseObject = {
  description?: string;
  content?: Record<string, MediaTypeObject>;
};

export type ParameterObject = {
  name: string;
  in: ParameterLocation;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
  example?: JsonValue;
};

export type OperationObject = {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
};

export type PathItemObject = Partial<Record<HttpMethod, OperationObject>> & {
  parameters?: ParameterObject[];
};

export type ServerObject = {
  url: string;
  description?: string;
};

export type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  host?: string;
  basePath?: string;
  schemes?: string[];
  servers?: ServerObject[];
  paths: Record<string, PathItemObject>;
};

export type Endpoint = {
  id: string;
  path: string;
  method: HttpMethod;
  operation: OperationObject;
  inheritedParameters: ParameterObject[];
};

export type ProxyResponsePayload = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
};
