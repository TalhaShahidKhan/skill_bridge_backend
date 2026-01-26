import { toNodeHandler } from "better-auth/node";
import express from "express";
import { auth } from "./lib/auth";

const app = express();
app.use(express.json());
app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/", (req, res) => {
  res.send("Hello World");
});
export default app;
