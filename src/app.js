import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { catchAsync } from "./utils/catch_async.js";
import userRouter from "./routes/user.routes.js";
import morgan from "morgan";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import commentRouter from "./routes/comment.routes.js";
import postRouter from "./routes/posts.routes.js";
import likeRouter from "./routes/like.route.js";
import historyRouter from "./routes/history.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use(cors());
app.set("query parser", "extended");
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// USER ROUTES
app.use("/api/v1/users", userRouter);

// SUBSCRIPTION ROUTES
app.use("/api/v1/subscriptions/", subscriptionRouter);

//PLAYLIST ROUTES
app.use("/api/v1/playlists", playlistRouter);

// VIDEO ROUTES
app.use("/api/v1/videos/", videoRouter);

// COMMENTS ROUTES
app.use("/api/v1/comments", commentRouter);

// POSTS ROUTES
app.use("/api/v1/posts", postRouter);

// LIKES ROUTES
app.use("/api/v1/likes", likeRouter);

// WATCH HISTORY ROUTES
app.use("/api/v1/watch-history", historyRouter);

// DASHBOARD ROUTES
app.use("/api/v1/dashboard", dashboardRouter);




export { app };
