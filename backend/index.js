import express from "express";
import cors from "cors";
import meRoutes from "./src/routes/me.routes.js";

const app = express();

const PORT = process.env.PORT || 3001;

const corsOptions = {
	origin: ["https://soc.aetherr.in", "http://localhost:3000"],
	credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/me", meRoutes);

app.listen(PORT, () => {
	console.log(`Server started at port ${PORT}`);
});
