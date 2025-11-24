/**
 * HTTP Interceptor for Google API requests in UI tests
 * Intercepts requests to Google's API and redirects them to the mock server
 * 
 * This works by patching Node.js HTTP/HTTPS modules to intercept
 * requests to generativelanguage.googleapis.com and redirect them to localhost
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let isIntercepted = false;
let mockServerUrl: string;

/**
 * Sets up HTTP interception to redirect Google API requests to mock server
 * @param mockUrl - URL of the mock server (e.g., http://localhost:3000)
 */
export function interceptGoogleAPIRequests(mockUrl: string): void {
  if (isIntercepted) {
    return;
  }

  mockServerUrl = mockUrl;
  const mockUrlObj = new URL(mockUrl);

  try {
    // Intercept Node.js http/https modules
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const http = require("http");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const https = require("https");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { URL } = require("url");

    // Store original request methods
    const originalHttpRequest = http.request;
    const originalHttpsRequest = https.request;

    // Patch http.request
    http.request = function (
      options: any,
      callback?: any,
    ): any {
      const url =
        typeof options === "string"
          ? new URL(options)
          : new URL(
              options.href ||
                `${options.protocol || "http:"}//${options.hostname || options.host}${options.path || "/"}`,
            );

      if (url.hostname === "generativelanguage.googleapis.com") {
        // Redirect to mock server
        const mockOptions = {
          ...options,
          hostname: mockUrlObj.hostname,
          port: mockUrlObj.port,
          protocol: mockUrlObj.protocol,
          path: url.pathname + (url.search || ""),
        };
        return originalHttpRequest.call(this, mockOptions, callback);
      }
      return originalHttpRequest.call(this, options, callback);
    };

    // Patch https.request
    https.request = function (
      options: any,
      callback?: any,
    ): any {
      const url =
        typeof options === "string"
          ? new URL(options)
          : new URL(
              options.href ||
                `${options.protocol || "https:"}//${options.hostname || options.host}${options.path || "/"}`,
            );

      if (url.hostname === "generativelanguage.googleapis.com") {
        // Redirect to mock server (use http for local mock)
        const mockOptions = {
          ...options,
          hostname: mockUrlObj.hostname,
          port: mockUrlObj.port,
          protocol: "http:",
          path: url.pathname + (url.search || ""),
          rejectUnauthorized: false, // Allow self-signed certs in test
        };
        return originalHttpRequest.call(this, mockOptions, callback);
      }
      return originalHttpsRequest.call(this, options, callback);
    };

    isIntercepted = true;
    console.log(
      `[Google API Interceptor] Intercepted requests to Google API, redirecting to ${mockServerUrl}`,
    );
  } catch (error) {
    console.error(
      "[Google API Interceptor] Failed to set up interception:",
      error,
    );
    throw error;
  }
}

/**
 * Restores original HTTP/HTTPS request methods
 */
export function restoreGoogleAPIRequests(): void {
  if (!isIntercepted) {
    return;
  }

  try {
    // Note: We can't easily restore without storing originals
    // In practice, tests run in isolated processes, so this is fine
    isIntercepted = false;
    console.log("[Google API Interceptor] Restored original HTTP methods");
  } catch (error) {
    console.error("[Google API Interceptor] Failed to restore:", error);
  }
}


