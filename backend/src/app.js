import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorMiddleware } from "./utils/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

app.use("/api", routes);

app.use(errorMiddleware);

export default app;
