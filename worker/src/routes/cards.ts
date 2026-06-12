import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { Env, CardRow } from "../types";
import { weightedShuffle } from "../utils/shuffle";

const cards = new Hono<{ Bindings: Env }>();

cards.get("/", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const categoryId = c.req.query("categoryId");

  const rows = categoryId
    ? await sql`
        SELECT
          c.*,
          cat.name AS category_name
        FROM cards c
        LEFT JOIN categories cat ON cat.id = c.category_id
        WHERE c.category_id = ${categoryId}
      `
    : await sql`
        SELECT
          c.*,
          cat.name AS category_name
        FROM cards c
        LEFT JOIN categories cat ON cat.id = c.category_id
      `;

  return c.json(weightedShuffle(rows as CardRow[]));
});

cards.get("/difficult", async (c) => {
  const sql = neon(c.env.DATABASE_URL);

  const rows = await sql`
    SELECT
      c.*,
      cat.name AS category_name
    FROM cards c
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE c.difficulty > 3
    ORDER BY c.difficulty DESC
  ` as CardRow[];

  return c.json(rows);
});

cards.get("/search", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const q = c.req.query("q") ?? "";

  if (!q.trim()) return c.json([]);

  const pattern = `%${q.trim()}%`;

  const rows = await sql`
    SELECT
      c.*,
      cat.name AS category_name
    FROM cards c
    LEFT JOIN categories cat ON cat.id = c.category_id
    WHERE
      c.english  ILIKE ${pattern}
      OR c.russian ILIKE ${pattern}
      OR cat.name  ILIKE ${pattern}
    ORDER BY c.english
    LIMIT 50
  ` as CardRow[];

  return c.json(rows);
});

cards.post("/:id/review", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const id = c.req.param("id");

  let body: { known: boolean };
  try {
    body = await c.req.json<{ known: boolean }>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.known !== "boolean") {
    return c.json({ error: "Field 'known' must be a boolean" }, 400);
  }

  const { known } = body;

  const rows = known
    ? await sql`
        UPDATE cards SET
          success_count    = success_count + 1,
          difficulty       = GREATEST(0, difficulty - 1),
          last_reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *, (
          SELECT name FROM categories WHERE id = category_id
        ) AS category_name
      `
    : await sql`
        UPDATE cards SET
          failure_count    = failure_count + 1,
          difficulty       = difficulty + 1,
          last_reviewed_at = NOW()
        WHERE id = ${id}
        RETURNING *, (
          SELECT name FROM categories WHERE id = category_id
        ) AS category_name
      `;

  if (rows.length === 0) {
    return c.json({ error: "Card not found" }, 404);
  }

  return c.json(rows[0]);
});

export default cards;
