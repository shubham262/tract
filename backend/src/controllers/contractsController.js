import prisma from "../lib/prisma.js";
import { validateContractPayload } from "../utils/validateContractPayload.js";
import sseHub from "../lib/sseHub.js";

const STATUS_VALUES = ["DRAFT", "FINALIZED", "ARCHIVED"];
const NEXT_STATUS = { DRAFT: "FINALIZED", FINALIZED: "ARCHIVED" };

export const createContract = async (req, res) => {
	const { organizationId } = req.params;
	const result = validateContractPayload(req.body);

	if (!result.valid) {
		return res.status(400).json({ error: "Invalid contract data", details: result.errors });
	}

	try {
		const contract = await prisma.$transaction(async (tx) => {
			const created = await tx.contract.create({
				data: {
					organizationId,
					clientName: result.data.client_name,
					poRefNo: result.data.po_ref_no,
					fieldData: result.data,
					createdByUserId: req.user.id,
				},
			});

			await tx.contractEvent.create({
				data: {
					contractId: created.id,
					organizationId,
					eventType: "CREATED",
					userId: req.user.id,
					metadata: { status: created.status },
				},
			});

			return created;
		});

		res.status(201).json({ contract });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to create contract" });
	}
};

export const listContracts = async (req, res) => {
	const { organizationId } = req.params;
	const { status, q, client, contractId, page = "1", pageSize = "20" } = req.query;

	const pageNum = Math.max(parseInt(page, 10) || 1, 1);
	const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

	const where = { organizationId };

	if (status) {
		if (!STATUS_VALUES.includes(status)) {
			return res.status(400).json({ error: "Invalid status filter" });
		}
		where.status = status;
	}

	const clientSearch = (client ?? q)?.trim();
	if (clientSearch) {
		where.clientName = { contains: clientSearch, mode: "insensitive" };
	}

	if (contractId?.trim()) {
		where.id = { contains: contractId.trim() };
	}

	try {
		const [contracts, total] = await prisma.$transaction([
			prisma.contract.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (pageNum - 1) * pageSizeNum,
				take: pageSizeNum,
			}),
			prisma.contract.count({ where }),
		]);

		res.json({ contracts, total, page: pageNum, pageSize: pageSizeNum });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to list contracts" });
	}
};

export const getContract = async (req, res) => {
	const { organizationId, contractId } = req.params;
	try {
		const contract = await prisma.contract.findFirst({ where: { id: contractId, organizationId } });
		if (!contract) return res.status(404).json({ error: "Contract not found" });
		res.json({ contract });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to load contract" });
	}
};

export const updateContract = async (req, res) => {
	const { organizationId, contractId } = req.params;
	const result = validateContractPayload(req.body);

	if (!result.valid) {
		return res.status(400).json({ error: "Invalid contract data", details: result.errors });
	}

	try {
		const existing = await prisma.contract.findFirst({ where: { id: contractId, organizationId } });
		if (!existing) return res.status(404).json({ error: "Contract not found" });
		if (existing.status !== "DRAFT") {
			return res.status(409).json({ error: "Only draft contracts can be edited" });
		}

		const [updated] = await prisma.$transaction([
			prisma.contract.update({
				where: { id: contractId },
				data: {
					clientName: result.data.client_name,
					poRefNo: result.data.po_ref_no,
					fieldData: result.data,
				},
			}),
			prisma.contractEvent.create({
				data: {
					contractId,
					organizationId,
					eventType: "UPDATED",
					userId: req.user.id,
					metadata: { before: existing.fieldData, after: result.data },
				},
			}),
		]);

		res.json({ contract: updated });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to update contract" });
	}
};

export const updateContractStatus = async (req, res) => {
	const { organizationId, contractId } = req.params;
	const { status: targetStatus } = req.body;

	if (!["FINALIZED", "ARCHIVED"].includes(targetStatus)) {
		return res.status(400).json({ error: "status must be FINALIZED or ARCHIVED" });
	}

	try {
		const contract = await prisma.contract.findFirst({ where: { id: contractId, organizationId } });
		if (!contract) return res.status(404).json({ error: "Contract not found" });

		const allowedNext = NEXT_STATUS[contract.status];
		if (allowedNext !== targetStatus) {
			return res.status(409).json({
				error: `Cannot transition contract from ${contract.status} to ${targetStatus}`,
			});
		}

		const [updated] = await prisma.$transaction([
			prisma.contract.update({ where: { id: contractId }, data: { status: targetStatus } }),
			prisma.contractEvent.create({
				data: {
					contractId,
					organizationId,
					eventType: "STATUS_CHANGED",
					userId: req.user.id,
					metadata: { from: contract.status, to: targetStatus },
				},
			}),
		]);

		sseHub.broadcast(organizationId, { type: "contract_status_changed", contract: updated });

		res.json({ contract: updated });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to update contract status" });
	}
};

export const deleteContract = async (req, res) => {
	const { organizationId, contractId } = req.params;
	try {
		const existing = await prisma.contract.findFirst({ where: { id: contractId, organizationId } });
		if (!existing) return res.status(404).json({ error: "Contract not found" });
		if (existing.status !== "DRAFT") {
			return res.status(409).json({ error: "Only draft contracts can be deleted" });
		}

		// ContractEvent rows have no FK to Contract, so the DELETED event
		// (and full prior history) survives the contract row being removed.
		await prisma.$transaction([
			prisma.contractEvent.create({
				data: {
					contractId,
					organizationId,
					eventType: "DELETED",
					userId: req.user.id,
					metadata: { clientName: existing.clientName, poRefNo: existing.poRefNo },
				},
			}),
			prisma.contract.delete({ where: { id: contractId } }),
		]);

		res.status(204).send();
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to delete contract" });
	}
};

export const listContractEvents = async (req, res) => {
	const { organizationId, contractId } = req.params;
	try {
		const events = await prisma.contractEvent.findMany({
			where: { contractId, organizationId },
			orderBy: { createdAt: "asc" },
		});
		res.json({ events });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to load contract events" });
	}
};

export const streamContractEvents = (req, res) => {
	const { organizationId } = req.params;

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});
	res.write(": connected\n\n");

	sseHub.subscribe(organizationId, res);

	const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25000);

	req.on("close", () => {
		clearInterval(heartbeat);
		sseHub.unsubscribe(organizationId, res);
	});
};
