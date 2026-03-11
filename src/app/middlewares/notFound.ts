import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger";

const notFound = (req: Request, res: Response) => {
  logger.warn({
    message: `Route Not Found: ${req.method} ${req.originalUrl}`,
  });
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route Not Found!",
  });
};

export default notFound;
