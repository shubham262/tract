const { configureStore } = require("@reduxjs/toolkit");
import authReducer from "./authSlice";
import orgReducer from "./orgSlice";

const makeStore = () =>
	configureStore({
		reducer: {
			auth: authReducer,
			org: orgReducer,
		},
	});

export default makeStore;
