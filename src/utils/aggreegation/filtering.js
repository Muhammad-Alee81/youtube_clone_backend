export const advancedFiltering = (filters, pipeline) => {
        // ADVANCED FILTERING
        let queryStr = JSON.stringify(filters);

        queryStr = queryStr.replace(
                /\b(gt|lt|lte|gte)\b/g,
                (match) => `$${match}`
        );

        if (Object.keys(filters).length) {
                pipeline.push({
                        $match: JSON.parse(queryStr),
                });
        }
};
