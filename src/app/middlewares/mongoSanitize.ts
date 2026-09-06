import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const DANGEROUS_KEYS = /^\$|^\.|__proto__|constructor|prototype/;

const findDangerousKeys = (obj: unknown, path = ""): string | null => {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = findDangerousKeys(obj[i], `${path}[${i}]`);
      if (result) return result;
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      if (DANGEROUS_KEYS.test(key)) {
        return `${path}.${key}`;
      }
      const result = findDangerousKeys(
        (obj as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
      if (result) return result;
    }
  }
  return null;
};

const mongoSanitizeCustom = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  for (const key of ["body", "query", "params"] as const) {
    const value = req[key];
    if (value && typeof value === "object") {
      const dangerous = findDangerousKeys(value, key);
      if (dangerous) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `Potentially malicious input detected: ${dangerous}`,
        });
      }
    }
  }
  next();
};

export default mongoSanitizeCustom;
