import express from "express";
import { getMe } from "../controllers/meController.js";
import verifySupabaseToken from "../middleware/verifySupabaseToken.js";

const router = express.Router();

router.get("/", verifySupabaseToken, getMe);

export default router;
