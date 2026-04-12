import type { NextFunction, Request, Response } from "express";

export const DEFAULT_API_VERSION = 1 as const;
export const LATEST_API_VERSION = 2 as const;
export const SUPPORTED_API_VERSIONS = [1, 2] as const;

export type ApiVersion = (typeof SUPPORTED_API_VERSIONS)[number];

const parseVersion = (value: string | undefined): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isInteger(num)) return null;
  return num;
};

const parseVersionFromPath = (path: string): number | null => {
  // Supports:
  // - /v1/...
  // - /v2
  // - v1 (if someone sends it without leading slash)
  const match = path.match(/(?:^|\/)v(\d+)(?:\/|$)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isInteger(num) ? num : null;
};

export const resolveApiVersion = (req: Request): number => {
  // 1) URL path has highest precedence (/api/v2/..)
  const fromPath = parseVersionFromPath(req.path);
  if (fromPath !== null) return fromPath;

  // 2) Prefer standards-ish header
  const acceptVersion = parseVersion(req.header("accept-version"));
  if (acceptVersion !== null) return acceptVersion;

  // 3) Back-compat / common header name
  const xApiVersion = parseVersion(req.header("x-api-version"));
  if (xApiVersion !== null) return xApiVersion;

  return DEFAULT_API_VERSION;
};

export const apiVersioning =
  () => (req: Request, res: Response, next: NextFunction) => {
    const version = resolveApiVersion(req);
    req.apiVersion = version;

    if (!SUPPORTED_API_VERSIONS.includes(version as ApiVersion)) {
      return res.status(400).json({
        message: `Unsupported API version: ${version}`,
        supportedVersions: SUPPORTED_API_VERSIONS,
        latestVersion: LATEST_API_VERSION,
      });
    }

    // Deprecation signaling: mark older versions as deprecated (once a newer exists)
    if (version < LATEST_API_VERSION) {
      res.setHeader("Deprecation", "true");
      // Use a conservative sunset date far enough out; adjust as your release policy evolves.
      res.setHeader("Sunset", "Wed, 01 Jul 2026 00:00:00 GMT");
    }

    // Encourage using Accept-Version (while still supporting X-API-Version)
    if (req.header("x-api-version") && !req.header("accept-version")) {
      res.setHeader(
        "Warning",
        '299 - "X-API-Version is deprecated; use Accept-Version"',
      );
    }

    next();
  };
