/**
 * Utility functions for Vercel Speed Insights integration.
 * 
 * Speed Insights provides real-time performance monitoring for web applications.
 * This utility provides helper functions to generate Speed Insights scripts
 * that can be injected into HTML responses.
 * 
 * @see https://vercel.com/docs/speed-insights
 */

/**
 * Generates the Speed Insights script tag for HTML injection.
 * 
 * This function returns the HTML script tags needed to initialize
 * Vercel Speed Insights tracking. The script can be injected into
 * any HTML response, typically in the <head> section.
 * 
 * @returns HTML string containing Speed Insights initialization scripts
 * 
 * @example
 * ```typescript
 * const htmlContent = `
 *   <html>
 *     <head>
 *       ${getSpeedInsightsScript()}
 *     </head>
 *     <body>...</body>
 *   </html>
 * `;
 * ```
 */
export const getSpeedInsightsScript = (): string => {
  return `
    <script>
      window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
    </script>
    <script defer src="/_vercel/speed-insights/script.js"></script>`;
};

/**
 * Injects Speed Insights script into an HTML string.
 * 
 * This function takes an HTML string and injects the Speed Insights
 * script before the closing </head> tag. If no </head> tag is found,
 * the script is injected before the closing </html> tag as a fallback.
 * 
 * @param html - The HTML string to inject the script into
 * @returns Modified HTML string with Speed Insights script injected
 * 
 * @example
 * ```typescript
 * const html = '<html><head><title>Page</title></head><body>Content</body></html>';
 * const injectedHtml = injectSpeedInsights(html);
 * ```
 */
export const injectSpeedInsights = (html: string): string => {
  const script = getSpeedInsightsScript();

  // Try to inject before </head> first
  if (html.includes("</head>")) {
    return html.replace("</head>", `${script}\n  </head>`);
  }

  // Fallback: inject before </html>
  if (html.includes("</html>")) {
    return html.replace("</html>", `${script}\n</html>`);
  }

  // If no closing tags found, append at the end
  return html + script;
};

/**
 * Configuration options for Speed Insights.
 * 
 * These can be used to customize the Speed Insights behavior
 * when integrating with frontend applications.
 */
export interface SpeedInsightsConfig {
  /**
   * Enable or disable Speed Insights.
   * Default: true in production, false in development
   */
  enabled?: boolean;

  /**
   * Debug mode for Speed Insights.
   * Logs additional information to the console.
   */
  debug?: boolean;

  /**
   * Sample rate for Speed Insights (0-1).
   * 1 = 100% of page views tracked, 0.5 = 50% of page views tracked.
   * Default: 1
   */
  sampleRate?: number;
}

/**
 * Checks if Speed Insights should be enabled based on environment.
 * 
 * @param config - Optional configuration object
 * @returns true if Speed Insights should be enabled
 */
export const shouldEnableSpeedInsights = (
  config?: SpeedInsightsConfig,
): boolean => {
  if (config?.enabled !== undefined) {
    return config.enabled;
  }

  // Enable by default in production, disable in development
  return process.env.NODE_ENV === "production";
};
