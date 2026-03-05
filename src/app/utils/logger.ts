/* eslint-disable @typescript-eslint/no-explicit-any */
/* Simple structured logger placeholder. Replace with Winston/Pino in production */
/* eslint-disable no-console */

type LogPayload = Record<string, unknown>;

const withBase = (level: string, payload: LogPayload) => ({
  level,
  time: new Date().toISOString(),
  ...payload,
});

const logger = {
  error: (payload: LogPayload) => {
    // Stringify errors properly if present
    const out: any = { ...payload };
    if (payload.err instanceof Error) {
      out.err = {
        name: payload.err.name,
        message: payload.err.message,
        stack: payload.err.stack,
      };
    }
    console.error(JSON.stringify(withBase("error", out)));
  },
  warn: (payload: LogPayload) => {
    console.warn(JSON.stringify(withBase("warn", payload)));
  },
  info: (payload: LogPayload) => {
    console.info(JSON.stringify(withBase("info", payload)));
  },
  debug: (payload: LogPayload) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(JSON.stringify(withBase("debug", payload)));
    }
  },
};

export default logger;
