import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { catchAsync } from "./utils/catch_async.js";
import userRouter from "./routes/user.routes.js";
import morgan from "morgan";
import subscriptionRouter from "./routes/subscription.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// USER ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions/", subscriptionRouter);

export { app };
