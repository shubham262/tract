import api from ".";

export const getOrganizations = async () => {
	try {
		const { data } = await api.get("/api/organizations");

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while fetching organizations"
		);
	}
};

export const createOrganization = async (name) => {
	try {
		const { data } = await api.post("/api/organizations", { name });

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while creating organization"
		);
	}
};
