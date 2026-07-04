const { configureStore } = require("@reduxjs/toolkit");
import authReducer from "./authSlice";
import orgReducer from "./orgSlice";
import contractReducer from "./contractSlice";

const makeStore = () =>
	configureStore({
		reducer: {
			auth: authReducer,
			org: orgReducer,
			contract: contractReducer,
		},
	});

export default makeStore;
