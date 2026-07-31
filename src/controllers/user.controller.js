import { User } from "../models/user.model.js";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import {
       setCookies,
       generateAccessAndRefreshToken,
       verifyRefreshToken,
} from "../utils/auth.utils.js";
import { cookieOption } from "../utils/auth.utils.js";
import {
       deletePreviousAvatar,
       uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";

// ---------------------------------------------
// ---------------------------------------------
//CONTROLLER FUNCTIONS STARTS HERE
// ---------------------------------------------
// ---------------------------------------------

export const register = catchAsync(async (req, res, next) => {
       const { username, email, password } = req.body;

       if ([username, email, password].some((field) => field?.trim() === "")) {
              return next(new ApiError("All fields are required", 400));
       }

       const checkUser = await User.findOne({ $or: [{ username }, { email }] });

       if (checkUser) {
              return next(new ApiError("user already exist", 400));
       }

       const user = await User.create({ username, email, password });
       const createdUser = await User.findById(user._id);

       if (!createdUser) {
              return next(
                     new ApiError(
                            "Something went wrong while registering the user",
                            500
                     )
              );
       }

       const { accessToken, refreshToken } =
              await generateAccessAndRefreshToken(createdUser);

       setCookies(res, accessToken, refreshToken);

       return res.status(200).json({
              message: "user registered successfully",
              createdUser,
              token: {
                     accessToken,
              },
       });
});

export const login = catchAsync(async (req, res, next) => {
       const { email, password } = req.body;

       if (!email || !password) {
              return next(new ApiError("email or password is required", 400));
       }

       const user = await User.findOne({ email }).select("+password");

       if (!user) {
              return next(new ApiError("invalid email or password", 401));
       }

       const checkPass = await user.comparePassword(password);

       if (!checkPass) {
              return next(new ApiError("incorrect email or password", 401));
       }

       const { accessToken, refreshToken } =
              await generateAccessAndRefreshToken(user);

       setCookies(res, accessToken, refreshToken);

       return res.status(200).json({
              message: "user logged in successfully",
       });
});

export const logout = catchAsync(async (req, res, next) => {
       const user = req.user;

       user.refreshToken = undefined;
       await user.save({ validateBeforeSave: false });

       res.clearCookie("accessToken", cookieOption);
       res.clearCookie("refreshToken", cookieOption);

       return res.status(200).json({ message: "logout successfully" });
});

export const refreshToken = catchAsync(async (req, res, next) => {
       const incomingRefreshToken = req.cookies["refreshToken"];

       const { user, hashRefreshToken } =
              await verifyRefreshToken(incomingRefreshToken);

       if (user.refreshToken !== hashRefreshToken) {
              return next(
                     new ApiError("invalid or expired refresh token", 401)
              );
       }

       const { accessToken, refreshToken } =
              await generateAccessAndRefreshToken(user);
       setCookies(res, accessToken, refreshToken);

       return res.status(200).json(accessToken);
});

export const changeCurrentUserPassword = catchAsync(async (req, res, next) => {
       const { currentPassword, newPassword, confirmNewPassword } = req.body;

       const user = await User.findById(req.user.id).select("+password");

       const checkPass = await user.comparePassword(currentPassword);

       if (!checkPass) {
              return next(new ApiError("current password is incorrect", 401));
       }

       if (newPassword !== confirmNewPassword) {
              return next(
                     new ApiError(
                            "New password and confirm password do not match",
                            400
                     )
              );
       }

       const { accessToken, refreshToken } =
              await generateAccessAndRefreshToken(user);

       setCookies(res, accessToken, refreshToken);

       user.password = newPassword;
       await user.save({ validateBeforeSave: false });

       return res
              .status(200)
              .json({ message: "password changed successfully" });
});

export const getMe = catchAsync(async (req, res, next) => {
       const user = req.user;
       return res.status(200).json({ user });
});

export const updateProfile = catchAsync(async (req, res, next) => {
       const { fullName, email } = req.body;

       if (!fullName || !email) {
              return next(new ApiError("All fields are required", 400));
       }

       const updatedUser = await User.findByIdAndUpdate(
              req.user?.id,
              {
                     $set: { fullName, email },
              },
              { new: true }
       );

       return res.status(200).json({ message: "profile updated", updatedUser });
});

export const updateAvatar = catchAsync(async (req, res, next) => {
       const user = await User.findById(req.user.id).select("-refreshToken");

       const avatarFile = req.file;

       if (!avatarFile) {
              return next(new ApiError("Image file is missing", 400));
       }

       const uploadAvatar = await uploadOnCloudinary(
              avatarFile.path,
              "avatar",
              "image"
       );

       if (user?.avatar?.publicId) {
              await deletePreviousAvatar(user?.avatar?.publicId);
       }

       user.avatar = {
              url: uploadAvatar?.secure_url,
              publicId: uploadAvatar?.public_id,
       };

       await user.save({ validateBeforeSave: false });

       return res.status(200).json({
              message: "image updated",
              user,
       });
});

export const updateCoverImage = catchAsync(async (req, res, next) => {
       const user = await User.findById(req.user?.id).select("-refreshToken");

       const imageFile = req.file;

       if (!imageFile) {
              return next(new ApiError("Image file is missing", 400));
       }

       const coverImage = await uploadOnCloudinary(
              imageFile.path,
              "cover-images",
              "image"
       );

       if (user?.coverImage?.publicId) {
              await deletePreviousAvatar(user?.coverImage?.publicId);
       }

       user.coverImage = {
              url: coverImage?.secure_url,
              publicId: coverImage?.public_id,
       };

       await user.save({ validateBeforeSave: false });

       return res
              .status(200)
              .json({ message: "cover image updated successfully", user });
});

export const getUserChannelProfileDetails = catchAsync(
       async (req, res, next) => {
              const { username } = req.params;
              const currentUserId = new mongoose.Types.ObjectId(req.user?.id);

              const channelProfile = await User.aggregate([
                     {
                            $match: {
                                   username,
                            },
                     },

                     {
                            $lookup: {
                                   from: "subscriptions",
                                   foreignField: "channel",
                                   localField: "_id",
                                   as: "subscribers",
                            },
                     },

                     {
                            $lookup: {
                                   from: "subscriptions",
                                   foreignField: "subscriber",
                                   localField: "_id",
                                   as: "subscribedTo",
                            },
                     },

                     {
                            $addFields: {
                                   subscribersCount: {
                                          $size: "$subscribers",
                                   },

                                   subscribedToCount: {
                                          $size: "$subscribedTo",
                                   },

                                   isSubscribed: {
                                          $cond: {
                                                 if: {
                                                        $in: [
                                                               currentUserId,
                                                               "$subscribers.subscriber",
                                                        ],
                                                 },
                                                 then: true,
                                                 else: false,
                                          },
                                   },
                            },
                     },

                     {
                            $project: {
                                   username: 1,
                                   fullName: 1,
                                   email: 1,
                                   subscribersCount: 1,
                                   subscribedToCount: 1,
                            },
                     },
              ]);

              if (!channelProfile?.length) {
                     return next(new ApiError("channel does not exist", 404));
              }

              return res.status(200).json({ channelProfile });
       }
);

export const getUsersWatchHistory = catchAsync(async (req, res, next) => {



       


       return res.status(200).json({ message: "users watch history" });
});
