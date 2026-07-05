import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./authSlice";
import orgReducer from "./orgSlice";
import contractReducer from "./contractSlice";

const rootReducer = combineReducers({
	auth: authReducer,
	org: orgReducer,
	contract: contractReducer,
});

const persistConfig = {
	key: "root",
	storage,
	whitelist: ["org"], // Persist only the org slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const makeStore = () => {
	const store = configureStore({
		reducer: persistedReducer,
		middleware: (getDefaultMiddleware) =>
			getDefaultMiddleware({
				serializableCheck: {
					ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				},
			}),
	});

	return {
		store,
		persistor: persistStore(store),
	};
};

export default makeStore;
