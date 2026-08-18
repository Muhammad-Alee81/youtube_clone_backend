import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(checkAuth);

export default router;
