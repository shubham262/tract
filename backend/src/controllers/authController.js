import prisma from "../config/prisma.js";
import { seed } from "../scripts/seed.js";


export const ensureSeeded = async (req, res) => {
	try {
		const existingMembership = await prisma.organizationMember.findFirst({
			where: { userId: req.user.id },
		});

		if (existingMembership) {
			return res.json({ seeded: false });
		}

		await seed(req.user.id);
		res.json({ seeded: true });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Failed to seed account" });
	}
};
