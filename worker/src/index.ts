import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types";
import categoriesRoute from "./routes/categories";
import cardsRoute from "./routes/cards";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/categories", categoriesRoute);
app.route("/cards", cardsRoute);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
