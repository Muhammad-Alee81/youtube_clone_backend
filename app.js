import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { catchAsync } from "./src/utils/catch_async.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

export { app };
