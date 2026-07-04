import express from "express";
import {
	createOrganization,
	listOrganizations,
	getOrganization,
} from "../controllers/organizationsController.js";
import verifySupabaseToken from "../middleware/verifySupabaseToken.js";
import requireOrgMembership from "../middleware/requireOrgMembership.js";
import contractsRoutes from "./contracts.routes.js";

const router = express.Router();

router.use(verifySupabaseToken);

router.post("/", createOrganization);
router.get("/", listOrganizations);
router.get("/:organizationId", requireOrgMembership, getOrganization);
router.use("/:organizationId/contracts", requireOrgMembership, contractsRoutes);

export default router;
