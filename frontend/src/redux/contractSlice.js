import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	contracts: [],
	total: 0,
	page: 1,
	pageSize: 20,
	filters: { status: "", q: "" },
};

const contractSlice = createSlice({
	name: "contract",
	initialState,
	reducers: {
		setContracts: (state, action) => {
			const { contracts, total, page, pageSize } = action.payload;
			state.contracts = contracts;
			state.total = total;
			state.page = page;
			state.pageSize = pageSize;
		},
		setFilters: (state, action) => {
			state.filters = { ...state.filters, ...action.payload };
		},
	},
});

export const { setContracts, setFilters } = contractSlice.actions;

export default contractSlice.reducer;
