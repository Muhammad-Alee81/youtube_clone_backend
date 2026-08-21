import ApiError from "../utils/api_error.js";

export const validation = (schema) => {
        return (req, res, next) => {
                const result = schema.safeParse(req.query);

                if (!result.success) {
                        return next(new ApiError(result.error.name, 400));
                }

                req.validateQuery = result.data;

                next();
        };
};
