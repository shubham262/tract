import api from ".";

export const getContracts = async (orgId, params) => {
	try {
		const { data } = await api.get(`/api/organizations/${orgId}/contracts`, {
			params,
		});

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while fetching contracts"
		);
	}
};

export const getContract = async (orgId, contractId) => {
	try {
		const { data } = await api.get(
			`/api/organizations/${orgId}/contracts/${contractId}`
		);

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while fetching contract"
		);
	}
};

export const getContractEvents = async (orgId, contractId) => {
	try {
		const { data } = await api.get(
			`/api/organizations/${orgId}/contracts/${contractId}/events`
		);

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while fetching contract events"
		);
	}
};

export const createContract = async (orgId, payload) => {
	try {
		const { data } = await api.post(
			`/api/organizations/${orgId}/contracts`,
			payload
		);

		return data;
	} catch (error) {
		const err = new Error(
			error?.response?.data?.error ||
				"Something went wrong while creating contract"
		);
		err.details = error?.response?.data?.details;
		throw err;
	}
};

export const updateContract = async (orgId, contractId, payload) => {
	try {
		const { data } = await api.patch(
			`/api/organizations/${orgId}/contracts/${contractId}`,
			payload
		);

		return data;
	} catch (error) {
		const err = new Error(
			error?.response?.data?.error ||
				"Something went wrong while updating contract"
		);
		err.details = error?.response?.data?.details;
		throw err;
	}
};

export const updateContractStatus = async (orgId, contractId, status) => {
	try {
		const { data } = await api.patch(
			`/api/organizations/${orgId}/contracts/${contractId}/status`,
			{ status }
		);

		return data;
	} catch (error) {
		throw new Error(
			error?.response?.data?.error ||
				"Something went wrong while updating contract status"
		);
	}
};
