import express from "express";
import {
	createOrganization,
	listOrganizations,
	getOrganization,
} from "../controllers/organizationsController.js";
import verifySupabaseToken from "../middleware/verifySupabaseToken.js";
import requireOrgMembership from "../middleware/requireOrgMembership.js";

const router = express.Router();

router.use(verifySupabaseToken);

router.post("/", createOrganization);
router.get("/", listOrganizations);
router.get("/:organizationId", requireOrgMembership, getOrganization);

export default router;
