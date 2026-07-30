import ApiError from "../utils/api_error.js";

export const validation = (schema) => {
       return (req, res, next) => {
              const result = schema.safeParse(req.query);

              if (!result.success) {
                     return next(
                            new ApiError(
                                   400,
                                   "Validation failed",
                                   result.error.issues
                            )
                     );
              }

              req.validateQuery = result.data;

              next();
       };
};
