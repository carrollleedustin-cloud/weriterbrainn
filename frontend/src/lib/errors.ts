export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;

  constructor(status: number, body: string) {
    let code = "UNKNOWN";
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.detail === "string") detail = parsed.detail;
      if (typeof parsed.code === "string") code = parsed.code;
      if (parsed.errors && typeof parsed.errors === "object") {
        const parts = Object.entries(parsed.errors).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((e: unknown) => `${k}: ${e}`) : [`${k}: ${v}`]
        );
        if (parts.length) detail = parts.join(". ");
      }
    } catch {
      if (body.length > 300) detail = body.slice(0, 300) + "…";
    }
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 400 || this.status === 422;
  }

  get isServer() {
    return this.status >= 500;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
