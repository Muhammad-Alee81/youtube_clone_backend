import { pipeline } from "zod/v3";

export const pagination = ({ page, limit, pipeline, totalCount }) => {
        // PAGINATION
        const pageNum = page || 1;
        const limitNum = limit || 10;
        const skip = (pageNum - 1) * limitNum;

        pipeline.push(
                {
                        $facet: {
                                metadata: [
                                        {
                                                $count: totalCount,
                                        },
                                ],

                                data: [
                                        {
                                                $skip: skip,
                                        },
                                        {
                                                $limit: limitNum,
                                        },
                                ],
                        },
                },

                {
                        $project: {
                                [totalCount]: {
                                        $ifNull: [
                                                {
                                                        $arrayElemAt: [
                                                                `$metadata.${totalCount}`,
                                                                0,
                                                        ],
                                                },
                                                0,
                                        ],
                                },

                                result: {
                                        $size: "$data",
                                },

                                currentPage: {
                                        $literal: pageNum,
                                },

                                pageSize: {
                                        $literal: limitNum,
                                },

                                totalPages: {
                                        $ceil: {
                                                $divide: [
                                                        {
                                                                $ifNull: [
                                                                        {
                                                                                $arrayElemAt:
                                                                                        [
                                                                                                `$metadata.${totalCount}`,
                                                                                                0,
                                                                                        ],
                                                                        },
                                                                        0,
                                                                ],
                                                        },
                                                        limitNum,
                                                ],
                                        },
                                },

                                videos: "$data",
                        },
                }
        );
};
