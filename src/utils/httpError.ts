export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    "code" in err &&
    typeof (err as any).statusCode === "number" &&
    typeof (err as any).code === "string"
  );
}

export const httpErrors = {
  badRequest(message: string, code = "BAD_REQUEST") {
    return new HttpError(400, code, message);
  },
  unauthorized(message = "Authentication required.", code = "UNAUTHORIZED") {
    return new HttpError(401, code, message);
  },
  forbidden(message = "Insufficient permissions.", code = "FORBIDDEN") {
    return new HttpError(403, code, message);
  },
  notFound(message: string, code = "NOT_FOUND") {
    return new HttpError(404, code, message);
  },
  conflict(message: string, code = "CONFLICT") {
    return new HttpError(409, code, message);
  },
} as const;
