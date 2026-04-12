import client from "prom-client";
declare const register: client.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestDurationMicroseconds: client.Histogram<"route" | "method" | "status_code">;
export declare const updateSystemMetrics: () => Promise<void>;
export { register };
