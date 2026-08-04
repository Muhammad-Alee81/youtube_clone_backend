import * as z from "zod";

export const commentQueryValidation = z.object({
        sort: z.coerce.string().optional(),
        page: z.coerce.number().positive().optional(),
        limit: z.coerce.number().positive().optional(),
});
