import api from ".";

export const ensureSeeded = async () => {
	try {
		await api.post("/api/auth/seed");
	} catch (error) {
		console.error("Failed to seed account", error);
	}
};
