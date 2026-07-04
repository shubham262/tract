import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	organizations: [],
	currentOrgId: null,
};

const orgSlice = createSlice({
	name: "org",
	initialState,
	reducers: {
		setOrganizations: (state, action) => {
			state.organizations = action.payload;
		},
		setCurrentOrgId: (state, action) => {
			state.currentOrgId = action.payload;
		},
	},
});

export const { setOrganizations, setCurrentOrgId } = orgSlice.actions;

export default orgSlice.reducer;
