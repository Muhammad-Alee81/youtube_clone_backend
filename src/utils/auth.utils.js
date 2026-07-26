import { createHash } from "node:crypto";

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
