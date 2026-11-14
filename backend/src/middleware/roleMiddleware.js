/**
 * Middleware to restrict access to specific roles (e.g. 'admin').
 * Must be used after protect middleware.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}

/**
 * Convenient shorthand for Admin-only routes.
 */
export const requireAdmin = authorize('admin');
