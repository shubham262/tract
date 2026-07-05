import express from "express";
import { ensureSeeded } from "../controllers/authController.js";
import verifySupabaseToken from "../middleware/verifySupabaseToken.js";

const router = express.Router();

router.use(verifySupabaseToken);

router.post("/seed", ensureSeeded);

export default router;
