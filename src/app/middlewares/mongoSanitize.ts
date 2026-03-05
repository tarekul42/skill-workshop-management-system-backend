/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";

const sanitize = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitize(v));
  } else if (obj !== null && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    const sourceObj = obj as Record<string, unknown>;
    Object.keys(sourceObj).forEach((key) => {
      if (!key.startsWith("$") && !key.includes(".")) {
        newObj[key] = sanitize(sourceObj[key]);
      }
    });
    return newObj;
  }
  return obj;
};

const tryAssign = (
  req: Request,
  key: "body" | "query" | "params",
  value: unknown,
): boolean => {
  try {
    delete (req as any)[key];
    Object.defineProperty(req, key, {
      value: value,
      writable: true,
      configurable: true,
    });
    return true;
  } catch {
    return false;
  }
};

const mongoSanitizeCustom = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    tryAssign(req, "body", sanitize(req.body));
  }
  if (req.query && typeof req.query === "object") {
    tryAssign(req, "query", sanitize(req.query));
  }
  if (req.params && typeof req.params === "object") {
    tryAssign(req, "params", sanitize(req.params));
  }
  next();
};

export default mongoSanitizeCustom;
