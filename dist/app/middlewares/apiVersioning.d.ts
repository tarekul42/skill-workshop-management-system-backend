import type { NextFunction, Request, Response } from "express";
export declare const DEFAULT_API_VERSION: 1;
export declare const LATEST_API_VERSION: 2;
export declare const SUPPORTED_API_VERSIONS: readonly [1, 2];
export type ApiVersion = (typeof SUPPORTED_API_VERSIONS)[number];
export declare const resolveApiVersion: (req: Request) => number;
export declare const apiVersioning: () => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
