import pino from "pino";
import envVariables from "../config/env.js";

const transport =
  envVariables.NODE_ENV === "development"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined;

const logger = pino({
  level: envVariables.NODE_ENV === "development" ? "debug" : "info",
  transport,
  redact: [
    "password",
    "oldPassword",
    "newPassword",
    "token",
    "refreshToken",
    "resetToken",
    "cvv",
    "card_number",
    "store_passwd",
  ],
  base: {
    env: envVariables.NODE_ENV,
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

export default logger;
