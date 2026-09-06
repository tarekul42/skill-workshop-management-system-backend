import { doubleCsrf } from "csrf-csrf";
import envVariables from "./env.js";

/**
 * Server-to-server endpoints that must be fully CSRF-exempt:
 * they are called by payment gateways / OAuth providers, which cannot
 * carry browser cookies or custom headers.
 */
const S2S_EXEMPT_PATHS = [
  "/api/v1/payment/success",
  "/api/v1/payment/fail",
  "/api/v1/payment/cancel",
  "/api/v1/payment/ipn",
  "/api/v1/payment/validate-payment",
  "/api/v1/auth/google/callback",
  "/api/v1/health/health-check",
  "/api/v1/health/",
  "/api/v1/health/ping",
  "/api/v1/health/check-version",
];

/**
 * Browser-facing state-changing endpoints that are exempt from the CSRF
 * token itself but still require a NON-SIMPLE custom header. Plain HTML
 * forms and "simple" CORS requests cannot set custom headers, so this
 * blocks cross-site form-based CSRF while keeping SPA flows simple.
 * The frontend MUST send `X-Requested-With: XMLHttpRequest` on these calls.
 */
const HEADER_PROTECTED_EXEMPT_PATHS = [
  "/api/v1/auth/exchange-code",
  "/api/v1/auth/refresh-token",
  "/api/v1/auth/forgot-password",
  "/api/v1/otp/send",
  "/api/v1/otp/verify",
];

const isProduction = envVariables.NODE_ENV === "production";
const sameSite = envVariables.COOKIE_SAMESITE;

// Cross-origin architecture may require SameSite=None so the browser
// includes the CSRF cookie in cross-site requests.
// The __Host- prefix in production locks the cookie to the exact origin
// (requires Secure, Path=/, and no Domain attribute).
const csrfCookieName = isProduction ? "__Host-__csrf" : "__csrf";

const normalizePath = (req: { path: string }) =>
  req.path.replace(/\/+$/, "") || "/";

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => envVariables.CSRF_SECRET,
  // Bind to a real session id when available (OAuth/session flows);
  // fall back to IP only for anonymous first-contact requests.
  getSessionIdentifier: (req) =>
    req.sessionID || req.cookies?.sessionId || req.ip || "",
  cookieName: csrfCookieName,
  cookieOptions: {
    httpOnly: true,
    sameSite,
    secure: isProduction,
    path: "/",
  },
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"] as string,
  skipCsrfProtection: (req) => {
    if (envVariables.NODE_ENV === "test") return true;
    const normalized = normalizePath(req);

    if (S2S_EXEMPT_PATHS.some((path) => normalized === path)) {
      return true;
    }

    if (
      HEADER_PROTECTED_EXEMPT_PATHS.some((path) => normalized === path) &&
      req.headers["x-requested-with"] === "XMLHttpRequest"
    ) {
      return true;
    }

    return false;
  },
});

export { doubleCsrfProtection, generateCsrfToken };
