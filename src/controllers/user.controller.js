import { User } from "../models/user.model.js";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";
import {
       setCookies,
       generateAccessAndRefreshToken,
       verifyRefreshToken,
} from "../utils/auth.utils.js";
import { cookieOption } from "../utils/auth.utils.js";

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

