/**
 * Express 4 helper — forwards rejected promises to `next`.
 */
export function asyncHandler(fn) {
  return function asyncRoute(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
