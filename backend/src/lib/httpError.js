/**
 * Custom error type for expected API failures (4xx/5xx).
 * Route handlers throw this; errorHandler turns it into JSON for the client.
 */
export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
