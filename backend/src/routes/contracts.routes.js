import express from "express";
import {
	createContract,
	listContracts,
	getContract,
	updateContract,
	updateContractStatus,
	deleteContract,
	listContractEvents,
	streamContractEvents,
} from "../controllers/contractsController.js";

const router = express.Router({ mergeParams: true });

// "/stream" must be registered before "/:contractId" or Express matches it
// as a :contractId param instead.
router.get("/stream", streamContractEvents);

router.post("/", createContract);
router.get("/", listContracts);
router.get("/:contractId", getContract);
router.patch("/:contractId", updateContract);
router.patch("/:contractId/status", updateContractStatus);
router.delete("/:contractId", deleteContract);
router.get("/:contractId/events", listContractEvents);

export default router;
