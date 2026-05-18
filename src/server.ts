import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { logoRouter } from "./routes/logo.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api", logoRouter);

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`SVG Logo Generator running at http://localhost:${PORT}`);
});
