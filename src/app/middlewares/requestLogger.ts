import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
      logger.error(logData, "Request failed");
    } else if (statusCode >= 400) {
      logger.warn(logData, "Request warning");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
};

export default requestLogger;
