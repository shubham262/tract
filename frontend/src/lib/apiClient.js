import { supabase } from "./supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiFetch = async (path, options = {}) => {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const headers = {
		"Content-Type": "application/json",
		...(options.headers || {}),
		...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
	};

	const res = await fetch(`${API_URL}${path}`, { ...options, headers });
	const body = await res.json().catch(() => null);

	if (!res.ok) {
		const error = new Error(body?.error || `Request failed with status ${res.status}`);
		error.details = body?.details;
		error.status = res.status;
		throw error;
	}

	return body;
};
