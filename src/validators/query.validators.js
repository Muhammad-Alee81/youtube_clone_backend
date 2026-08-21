import * as z from "zod";

export const queryValidation = z.object({
        sort: z.enum(["views", "likesCount", "commentsCount"]).optional(),
        page: z.coerce.number().positive().optional(),
        limit: z.coerce.number().positive().optional(),
});
