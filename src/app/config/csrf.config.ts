import { doubleCsrf } from "csrf-csrf";
import envVariables from "./env";

/**
 * Paths that should skip CSRF validation.
 * These are either server-to-server callbacks (SSLCommerz) or OAuth redirects.
 */
const CSRF_EXEMPT_PATHS = [
  "/api/v1/payment/success",
  "/api/v1/payment/fail",
  "/api/v1/payment/cancel",
  "/api/v1/auth/google/callback",
  "/health-check",
];

const isProduction = envVariables.NODE_ENV === "production";

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => envVariables.CSRF_SECRET,
  getSessionIdentifier: (req) => req.cookies?.sessionId ?? req.ip ?? "",
  cookieName: "__csrf",
  cookieOptions: {
    httpOnly: true,
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction,
    path: "/",
  },
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
  skipCsrfProtection: (req) =>
    CSRF_EXEMPT_PATHS.some((path) => req.path === path),
});

export { doubleCsrfProtection, generateCsrfToken };
