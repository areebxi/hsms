/**
 * Wraps async route handlers so unhandled promise rejections reach errorHandler.
 * Express 4 does not do this automatically for async functions.
 */
export function asyncHandler(fn) {
  return function asyncRoute(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
