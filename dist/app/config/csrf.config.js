import { doubleCsrf } from "csrf-csrf";
import envVariables from "./env.js";
/**
 * Paths that should skip CSRF validation.
 * These are either server-to-server callbacks (SSLCommerz) or OAuth redirects.
 */
const CSRF_EXEMPT_PATHS = [
    "/api/v1/payment/success",
    "/api/v1/payment/fail",
    "/api/v1/payment/cancel",
    "/api/v1/payment/ipn",
    "/api/v1/auth/google/callback",
    "/api/v1/auth/exchange-code",
    "/api/v1/user/register",
    "/api/v1/auth/login",
    "/api/v1/auth/forgot-password",
    "/api/v1/otp/send",
    "/api/v1/otp/verify",
    "/api/v1/health/health-check",
    "/api/v1/health/",
    "/api/v1/health/ping",
    "/api/v1/health/check-version",
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
    getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
    skipCsrfProtection: (req) => {
        if (envVariables.NODE_ENV === "test")
            return true;
        const isExempt = CSRF_EXEMPT_PATHS.some((path) => req.path === path);
        return isExempt;
    },
});
export { doubleCsrfProtection, generateCsrfToken };
