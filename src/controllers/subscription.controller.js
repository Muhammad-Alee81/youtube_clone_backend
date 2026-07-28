import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import mongoose from "mongoose";

export const subscribeChannel = catchAsync(async (req, res, next) => {
       const subscriber = req.user?.id;
       const { channelId } = req.params;

       if (!channelId) {
              return next(new ApiError("channel ID is required", 400));
       }

       if (!mongoose.Types.ObjectId.isValid(channelId)) {
              return next(new ApiError("Invalid channel ID", 400));
       }

       if (subscriber === channelId) {
              return next(
                     new ApiError("you cannot subscribe your own channel", 409)
              );
       }

       const channel = await User.findById(channelId);

       if (!channel) {
              return next(new ApiError("channel not found", 404));
       }

       const checkAlreadySubscribe = await Subscription.findOne({
              subscriber: req.user?.id,
              channel: channelId,
       });

       if (checkAlreadySubscribe) {
              return next(
                     new ApiError("Already subscribed to this channel", 409)
              );
       }

       const subscribe = await Subscription.create({
              subscriber,
              channel: channelId,
       });

       return res
              .status(200)
              .json({ message: "channel Subscribed", subscribe });
});
