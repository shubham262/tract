"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabaseClient";
import { updateUserInfo } from "@/redux/authSlice";

const AuthListener = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			dispatch(updateUserInfo(session?.user ?? null));
		});

		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			dispatch(updateUserInfo(session?.user ?? null));
		});

		return () => listener.subscription.unsubscribe();
	}, [dispatch]);

	return null;
};

export default AuthListener;
