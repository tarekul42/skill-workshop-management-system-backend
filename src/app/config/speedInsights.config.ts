/**
 * Vercel Speed Insights Configuration
 * 
 * This file contains configuration for Vercel Speed Insights integration.
 * 
 * IMPORTANT: Speed Insights is designed for frontend applications that run
 * in browsers. Since this is a backend API, the integration is limited to:
 * 
 * 1. Injecting the Speed Insights script into HTML responses (e.g., Swagger UI)
 * 2. Providing utilities for frontend applications that consume this API
 * 
 * For full Speed Insights functionality, your frontend application should
 * install and configure @vercel/speed-insights according to its framework:
 * - Next.js: import { SpeedInsights } from '@vercel/speed-insights/next'
 * - React: import { SpeedInsights } from '@vercel/speed-insights/react'
 * - Vue: import { SpeedInsights } from '@vercel/speed-insights/vue'
 * - etc.
 * 
 * @see https://vercel.com/docs/speed-insights/quickstart
 */

import envVariables from "./env";

/**
 * Configuration for Speed Insights
 */
export const speedInsightsConfig = {
  /**
   * Enable Speed Insights based on environment
   */
  enabled: envVariables.NODE_ENV === "production",

  /**
   * Debug mode for Speed Insights
   * Logs additional information when enabled
   */
  debug: envVariables.NODE_ENV !== "production",

  /**
   * Sample rate for Speed Insights (0-1)
   * 1 = 100% of page views tracked
   * 0.5 = 50% of page views tracked
   */
  sampleRate: 1,

  /**
   * Script source URL
   * This is the Vercel-hosted Speed Insights script
   */
  scriptSrc: "/_vercel/speed-insights/script.js",

  /**
   * Vitals endpoint for custom implementations
   * Note: This API is deprecated. Use @vercel/speed-insights package instead.
   */
  vitalsEndpoint: "https://vitals.vercel-analytics.com/v1/vitals",
};

export default speedInsightsConfig;
