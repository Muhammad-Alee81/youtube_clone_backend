import * as z from "zod";

const booleanQuery = z.preprocess((value) => {
        if (value === "true") return true;
        if (value === "false") return false;
        return value;
}, z.boolean());

export const getAllVideoQueryValidate = z.object({
        isPublished: booleanQuery.optional(),
        title: z.coerce.string().optional(),
        likesCount: z.coerce.number().optional(),
        commentsCount: z.coerce.number().optional(),

        duration: z
                .object({
                        gte: z.coerce.number().optional(),
                        lte: z.coerce.number().optional(),
                        gt: z.coerce.number().optional(),
                        lt: z.coerce.number().optional(),
                })
                .optional(),

        views: z
                .object({
                        gte: z.coerce.number().optional(),
                        lte: z.coerce.number().optional(),
                        gt: z.coerce.number().optional(),
                        lt: z.coerce.number().optional(),
                })
                .optional(),

        sort: z.coerce.string().optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
});
