import * as z from "zod";

export const getAllVideoQueryValidate = z.object({
       isPublished: z.coerce.boolean().optional(),
       title: z.coerce.string().optional(),

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
