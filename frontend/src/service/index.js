import axios from "axios";
import { supabase } from "@/config/supabase";

const api = axios.create({
	baseURL:
		process.env.NEXT_PUBLIC_ENVIRONMENT === "production"
			? process.env.NEXT_PUBLIC_BACKEND_URL
			: "http://localhost:3001",
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(async (config) => {
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session?.access_token) {
		config.headers.Authorization = `Bearer ${session.access_token}`;
	}

	return config;
});

export default api;
