import prisma from "../lib/prisma.js";

const requireOrgMembership = async (req, res, next) => {
	const { organizationId } = req.params;

	try {
		const membership = await prisma.organizationMember.findUnique({
			where: {
				organizationId_userId: {
					organizationId,
					userId: req.user.id,
				},
			},
			include: { organization: true },
		});

		if (!membership) {
			return res.status(403).json({ error: "You are not a member of this organization" });
		}

		req.membership = membership;
		req.organization = membership.organization;
		next();
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to verify organization membership" });
	}
};

export default requireOrgMembership;
