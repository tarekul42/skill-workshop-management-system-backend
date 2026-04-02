import { NextFunction, Request, Response } from "express";
import speedInsightsConfig from "../config/speedInsights.config";
import logger from "../utils/logger";
import { getSpeedInsightsScript } from "../utils/speedInsights";

/**
 * Middleware to inject Vercel Speed Insights script into HTML responses.
 * 
 * This middleware intercepts HTML responses and injects the Speed Insights
 * initialization script. This is useful for pages like Swagger UI that
 * serve HTML content from the backend.
 * 
 * Note: Speed Insights is primarily designed for frontend frameworks.
 * For full functionality, ensure your frontend application also includes
 * the appropriate Speed Insights package.
 * 
 * @see https://vercel.com/docs/speed-insights
 */
export const speedInsightsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Skip injection if Speed Insights is disabled
  if (!speedInsightsConfig.enabled) {
    return next();
  }

  // Store the original send function
  const originalSend = res.send.bind(res);

  // Override the send function
  res.send = function (body: unknown): Response {
    // Check if this is an HTML response
    const contentType = res.getHeader("content-type");
    const isHtml =
      contentType &&
      typeof contentType === "string" &&
      contentType.includes("text/html");

    // Only inject if it's HTML content
    if (isHtml && typeof body === "string") {
      try {
        // Check if there's a closing </head> tag to inject the script
        if (body.includes("</head>")) {
          const speedInsightsScript = getSpeedInsightsScript();

          // Inject the script before the closing </head> tag
          body = body.replace("</head>", `${speedInsightsScript}\n  </head>`);

          if (speedInsightsConfig.debug) {
            logger.debug({
              message: "Speed Insights script injected into HTML response",
              path: req.path,
            });
          }
        }
      } catch (error) {
        logger.error({
          message: "Error injecting Speed Insights script",
          err: error,
        });
      }
    }

    // Call the original send function with the modified body
    return originalSend(body);
  };

  next();
};
