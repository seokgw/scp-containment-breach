import express from "express";
import { mkdirSync } from "node:fs";
import { createHandler } from "./app.mjs";
import { SQLiteRepository } from "./sqlite.mjs";
mkdirSync(".local", { recursive: true });
const handler = createHandler(new SQLiteRepository(".local/game.sqlite"), {
  origin: process.env.APP_ORIGIN || "http://localhost:5173",
  secure: false,
});
const app = express();
app.disable("x-powered-by");
app.use(express.text({ type: "application/json", limit: "4kb" }));
app.use("/api", async (req, res) => {
  const request = new Request(
    `http://localhost:${process.env.PORT || 3001}${req.originalUrl}`,
    {
      method: req.method,
      headers: req.headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: req.body || "{}" }
        : {}),
    },
  );
  const response = await handler(request);
  res.status(response.status);
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(Buffer.from(await response.arrayBuffer()));
});
app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log("SCP API http://localhost:" + (process.env.PORT || 3001)),
);
