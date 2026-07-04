import { Router } from "express";
import verifySupabaseToken from "../middleware/verifySupabaseToken.js";

const router = Router();

router.get("/", verifySupabaseToken, (req, res) => {
	res.json({ user: req.user });
});

export default router;
