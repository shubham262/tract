/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { memo, useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import makeStore from "./store";

const StoreProvider = ({ children }) => {
	const storeRef = useRef(null);

	if (!storeRef.current) {
		storeRef.current = makeStore();
	}

	return (
		<Provider store={storeRef.current.store}>
			<PersistGate loading={null} persistor={storeRef.current.persistor}>
				{children}
			</PersistGate>
		</Provider>
	);
};

export default memo(StoreProvider);
