import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { mockSnapshot } from "./src/mockData";

const app = new Hono();

app.get("/compliance/snapshot", (c) => c.json(mockSnapshot));
app.get("/policies", (c) => c.json(mockSnapshot.policies));
app.get("/risks", (c) => c.json(mockSnapshot.risks));

const port = 4387;
console.log(`[mock-api] starting on :${port}`);
serve({ fetch: app.fetch, port });
