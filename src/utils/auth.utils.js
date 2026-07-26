import { createHash } from "node:crypto";
import { User } from "../models/user.model.js";
import ApiError from "./api_error.js";
import jwt from "jsonwebtoken";

export const cookieOption = {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
};

export const generateAccessAndRefreshToken = async (user) => {
       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       const hashRefreshToken = createHash("sha256")
              .update(refreshToken)
              .digest("hex");

       user.refreshToken = hashRefreshToken;

       await user.save({ validateBeforeSave: false });
       return { accessToken, refreshToken };
};

export const setCookies = (res, accessToken, refreshToken) => {
       res.cookie("accessToken", accessToken, {
              ...cookieOption,
              maxAge: 24 * 60 * 60 * 1000,
       });

       res.cookie("refreshToken", refreshToken, {
              ...cookieOption,
              maxAge: 7 * 24 * 60 * 60 * 1000,
       });
};

export const verifyRefreshToken = async (refreshToken) => {
       const decode = jwt.verify(
              refreshToken,
              process.env.REFRESH_TOKEN_SECRET
       );

       const user = await User.findById(decode.id);

       const hashRefreshToken = createHash("sha256")
              .update(refreshToken)
              .digest("hex");

       return { user, hashRefreshToken };
};
