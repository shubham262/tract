import prisma from "../config/prisma.js";

const contractFixture = (overrides) => ({
	client_name: "Acme Corp",
	po_ref_no: "PO-1001",
	po_date: "2026-01-15",
	payment_terms: "Net 30",
	delivery_terms: "FOB destination",
	items: [
		{ description: "Steel beams", quantity: 50, quantity_unit: "units", unit_price: 120, pricing_unit: "per unit", total: 6000 },
		{ description: "Welding service", quantity: 10, quantity_unit: "hours", unit_price: 45, pricing_unit: "per hour", total: 450 },
	],
	...overrides,
});

// Seeds a private pair of demo orgs + 5 contracts scoped to a single user.
// Org slugs are derived from userId so re-running for the same user is a
// no-op on the org/membership rows (upsert), but contracts are only meant
// to be created once per user — callers should guard against re-invoking
// this for a user who already has organizations.
export const seed = async (userId) => {
	if (!userId) throw new Error("seed(userId) requires a userId");

	const acme = await prisma.organization.upsert({
		where: { slug: `acme-industries-${userId}` },
		update: {},
		create: { name: "Acme Industries", slug: `acme-industries-${userId}` },
	});
	const globex = await prisma.organization.upsert({
		where: { slug: `globex-manufacturing-${userId}` },
		update: {},
		create: { name: "Globex Manufacturing", slug: `globex-manufacturing-${userId}` },
	});

	for (const org of [acme, globex]) {
		await prisma.organizationMember.upsert({
			where: { organizationId_userId: { organizationId: org.id, userId } },
			update: {},
			create: { organizationId: org.id, userId, role: "OWNER" },
		});
	}

	const contractsToCreate = [
		{ organizationId: acme.id, status: "DRAFT", fieldData: contractFixture({ client_name: "Bluewave Retail", po_ref_no: "PO-2001", po_date: "2026-06-01" }) },
		{ organizationId: acme.id, status: "FINALIZED", fieldData: contractFixture({ client_name: "Northstar Logistics", po_ref_no: "PO-2002", po_date: "2026-05-12" }) },
		{ organizationId: acme.id, status: "ARCHIVED", fieldData: contractFixture({ client_name: "Crestline Foods", po_ref_no: "PO-2003", po_date: "2026-02-20" }) },
		{ organizationId: globex.id, status: "DRAFT", fieldData: contractFixture({ client_name: "Ironclad Systems", po_ref_no: "PO-3001", po_date: "2026-06-18" }) },
		{ organizationId: globex.id, status: "FINALIZED", fieldData: contractFixture({ client_name: "Pinnacle Freight", po_ref_no: "PO-3002", po_date: "2026-04-03" }) },
	];

	for (const c of contractsToCreate) {
		const contract = await prisma.contract.create({
			data: {
				organizationId: c.organizationId,
				status: c.status,
				clientName: c.fieldData.client_name,
				poRefNo: c.fieldData.po_ref_no,
				fieldData: c.fieldData,
				createdByUserId: userId,
			},
		});

		await prisma.contractEvent.create({
			data: { contractId: contract.id, organizationId: c.organizationId, eventType: "CREATED", userId, metadata: { status: "DRAFT" } },
		});

		if (c.status !== "DRAFT") {
			await prisma.contractEvent.create({
				data: { contractId: contract.id, organizationId: c.organizationId, eventType: "STATUS_CHANGED", userId, metadata: { from: "DRAFT", to: "FINALIZED" } },
			});
		}
		if (c.status === "ARCHIVED") {
			await prisma.contractEvent.create({
				data: { contractId: contract.id, organizationId: c.organizationId, eventType: "STATUS_CHANGED", userId, metadata: { from: "FINALIZED", to: "ARCHIVED" } },
			});
		}
	}

	console.log(`Seed complete for user ${userId}: 2 organizations, 5 contracts.`);
	return [acme, globex];
};
