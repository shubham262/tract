import jwt from "jsonwebtoken";

const verifySupabaseToken = (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const [scheme, token] = authHeader.split(" ");

	if (scheme !== "Bearer" || !token) {
		return res.status(401).json({ error: "Missing or malformed Authorization header" });
	}

	try {
		const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
			algorithms: ["HS256"],
		});

		req.user = {
			id: decoded.sub,
			email: decoded.email,
			role: decoded.role,
		};

		next();
	} catch (err) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};

export default verifySupabaseToken;
