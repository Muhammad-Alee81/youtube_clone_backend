export const sorting = (sort, pipeline) => {
        if (sort) {
                const sortFields = sort.split(",");
                const sortObj = {};

                sortFields.forEach((field) => {
                        if (field.startsWith("-")) {
                                sortObj[field.slice(1)] = -1;
                        } else {
                                sortObj[field] = 1;
                        }
                });

                pipeline.push({
                        $sort: sortObj,
                });
        } else {
                pipeline.push({
                        $sort: {
                                createdAt: -1,
                        },
                });
        }
};
