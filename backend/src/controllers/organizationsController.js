import prisma from "../config/prisma.js";

const slugify = (name) =>
	name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const generateSlug = (name) =>
	`${slugify(name) || "org"}-${Math.random().toString(36).slice(2, 8)}`;

export const createOrganization = async (req, res) => {
	const { name } = req.body;

	if (!name || typeof name !== "string" || !name.trim()) {
		return res.status(400).json({ error: "Organization name is required" });
	}

	try {
		const organization = await prisma.$transaction(async (tx) => {
			const org = await tx.organization.create({
				data: {
					name: name.trim(),
					slug: generateSlug(name),
				},
			});

			await tx.organizationMember.create({
				data: {
					organizationId: org.id,
					userId: req.user.id,
					role: "OWNER",
				},
			});

			return org;
		});

		res.status(201).json({ organization });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to create organization" });
	}
};

export const listOrganizations = async (req, res) => {
	try {
		const memberships = await prisma.organizationMember.findMany({
			where: { userId: req.user.id },
			include: { organization: true },
			orderBy: { organization: { createdAt: "asc" } },
		});

		const organizations = memberships.map((m) => ({
			...m.organization,
			role: m.role,
		}));

		res.json({ organizations });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to list organizations" });
	}
};

export const getOrganization = (req, res) => {
	res.json({
		organization: { ...req.organization, role: req.membership.role },
	});
};
