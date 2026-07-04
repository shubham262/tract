import supabase from "../config/supabase.js";

const verifySupabaseToken = async (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const [scheme, headerToken] = authHeader.split(" ");
	const token = scheme === "Bearer" && headerToken ? headerToken : req.query.token;

	if (!token) {
		return res
			.status(401)
			.json({ error: "Missing or malformed Authorization header" });
	}

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token);

	if (error || !user) {
		console.error("error", error);
		return res.status(401).json({ error: "Invalid or expired token" });
	}

	req.user = {
		id: user.id,
		email: user.email,
		role: user.role,
	};

	next();
};

export default verifySupabaseToken;
