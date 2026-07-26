import { User } from "../models/user.model.js";
import ApiError from "../utils/api_error.js";
import { catchAsync } from "../utils/catch_async.js";
import jwt from "jsonwebtoken";

export const checkAuth = catchAsync(async (req, res, next) => {
       let token;

       if (
              req.headers.authorization &&
              req.headers.authorization.startsWith("Bearer")
       ) {
              token = req.headers.authorization.split(" ")[1];
       } else if (req.cookies["accessToken"]) {
              token = req.cookies["accessToken"];
       }

       if (!token) {
              return next(new ApiError("you are not logged in", 401));
       }

       const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

       const user = await User.findById(decode.id).select("-refreshToken");

       if (!user) {
              return next(
                     new ApiError(
                            "The user belonging to this token does no longer exist",
                            401
                     )
              );
       }

       req.user = user;

       next();
});
