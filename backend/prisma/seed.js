import prisma from "../src/lib/prisma.js";

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

async function main() {
	const seedUserId = process.env.SEED_USER_ID || "00000000-0000-0000-0000-000000000000";

	const acme = await prisma.organization.upsert({
		where: { slug: "acme-industries" },
		update: {},
		create: { name: "Acme Industries", slug: "acme-industries" },
	});
	const globex = await prisma.organization.upsert({
		where: { slug: "globex-manufacturing" },
		update: {},
		create: { name: "Globex Manufacturing", slug: "globex-manufacturing" },
	});

	for (const org of [acme, globex]) {
		await prisma.organizationMember.upsert({
			where: { organizationId_userId: { organizationId: org.id, userId: seedUserId } },
			update: {},
			create: { organizationId: org.id, userId: seedUserId, role: "OWNER" },
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
				createdByUserId: seedUserId,
			},
		});

		await prisma.contractEvent.create({
			data: { contractId: contract.id, organizationId: c.organizationId, eventType: "CREATED", userId: seedUserId, metadata: { status: "DRAFT" } },
		});

		if (c.status !== "DRAFT") {
			await prisma.contractEvent.create({
				data: { contractId: contract.id, organizationId: c.organizationId, eventType: "STATUS_CHANGED", userId: seedUserId, metadata: { from: "DRAFT", to: "FINALIZED" } },
			});
		}
		if (c.status === "ARCHIVED") {
			await prisma.contractEvent.create({
				data: { contractId: contract.id, organizationId: c.organizationId, eventType: "STATUS_CHANGED", userId: seedUserId, metadata: { from: "FINALIZED", to: "ARCHIVED" } },
			});
		}
	}

	console.log("Seed complete: 2 organizations, 5 contracts.");
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => process.exit(0));
