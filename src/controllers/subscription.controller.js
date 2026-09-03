import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { pagination } from "../utils/aggreegation/pagination.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import mongoose from "mongoose";

export const subscribeChannel = catchAsync(async (req, res, next) => {
    // sab sy pehly user kee id lain gay joo subscribe kr raha h channel koo
    const subscriber = req.user?.id;
    // phir channel kee id lain gay
    const { channelId } = req.params;

    //  channel kee ID kee validation karain gay
    if (!channelId) {
        return next(new ApiError("channel ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return next(new ApiError("Invalid channel ID", 400));
    }

    //  check krna subscriber or channel id agr same h tou error return krna
    if (subscriber.toString() === channelId) {
        return next(new ApiError("you cannot subscribe your own channel", 400));
    }

    //  check krna k channel exist krta h ya nhi agr nhi krta tou error doo
    const channel = await User.findById(channelId);

    if (!channel) {
        return next(new ApiError("channel not found", 404));
    }

    const checkAlreadySubscribe = await Subscription.findOne({
        subscriber: req.user?.id,
        channel: channelId,
    });

    if (checkAlreadySubscribe) {
        return next(new ApiError("Already subscribed to this channel", 409));
    }

    const subscribe = await Subscription.create({
        subscriber,
        channel: channelId,
    });

    return res.status(201).json({
        message: "channel Subscribed",
        data: {
            _id: subscribe._id,
            subscriber: subscribe.subscriber,
            channel: subscribe.channel,
            createdAt: subscribe.createdAt,
        },
    });
});

export const unSubscribeChannel = catchAsync(async (req, res, next) => {
    const { channelId } = req.params;
    const subscriber = req.user?.id;

    if (!channelId) {
        return next(new ApiError("channel ID is required", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        return next(new ApiError("Invalid channel ID", 400));
    }

    const unSubscribe = await Subscription.findOneAndDelete({
        subscriber,
        channel: channelId,
    });

    if (!unSubscribe) {
        return next(
            new ApiError("you are not subscribed to this channel", 404)
        );
    }

    return res.status(200).json({
        message: "channel unsubscribed",
        data: {
            data: {
                _id: unSubscribe._id,
                subscriber: unSubscribe.subscriber,
                channel: unSubscribe.channel,
                createdAt: unSubscribe.createdAt,
            },
        },
    });
});

export const recentSubscribers = catchAsync(async (req, res, next) => {
    const { page, limit } = req.validateQuery;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 401));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                channel: new mongoose.Types.ObjectId(req.user.id),
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        }
    );

    pipeline.push(
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },

        {
            $unwind: "$subscribers",
        },

        {
            $project: {
                createdAt: 1,
                subscribers: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalSubscribers" });

    const recentSubscribers = await Subscription.aggregate(pipeline);

    return res.status(200).json({ status: "success", recentSubscribers });
});

export const getSubscribedChannels = catchAsync(async (req, res, next) => {
    const { page, limit } = req.validateQuery;

    if (!req.user?.id) {
        return next(new ApiError("unauthorized", 401));
    }

    const pipeline = [];

    pipeline.push(
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user.id),
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$channel",
        },
        {
            $project: {
                channel: 1,
            },
        }
    );

    pagination({ page, limit, pipeline, totalCount: "totalChannels" });

    const subscribedTo = await Subscription.aggregate(pipeline);

    return res.status(200).json({ status: "success", subscribedTo });
});
