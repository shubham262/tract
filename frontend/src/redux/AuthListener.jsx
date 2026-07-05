"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/config/supabase";
import { updateUserInfo } from "@/redux/authSlice";
import { ensureSeeded } from "@/service/auth";

const AuthListener = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			dispatch(updateUserInfo(session?.user ?? null));
			if (session?.user) ensureSeeded();
		});

		// SIGNED_IN covers both a freshly-confirmed signup and a normal login;
		// the backend no-ops if the user already has organizations, so it's
		// safe to call here even though this can fire more than once per user.
		const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
			dispatch(updateUserInfo(session?.user ?? null));
			if (event === "SIGNED_IN" && session?.user) ensureSeeded();
		});

		return () => listener.subscription.unsubscribe();
	}, [dispatch]);

	return null;
};

export default AuthListener;
