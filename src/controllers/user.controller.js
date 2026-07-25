import { User } from "../models/user.model.js";
import { catchAsync } from "../utils/catch_async.js";
import ApiError from "../utils/api_error.js";

export const register = catchAsync(async (req, res, next) => {
       const { username, email, password } = req.body;

       const checkUser = await User.findOne({ email });

       if (checkUser) {
              return next(new ApiError("user already exist", 400));
       }

       const user = await User.create({ username, email, password });

       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       return res
              .status(200)
              .json({
                     message: "user registered successfully",
                     user,
                     token: { accessToken, refreshToken },
              });
});
