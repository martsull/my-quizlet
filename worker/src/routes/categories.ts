import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { Env, CategoryRow } from "../types";

const categories = new Hono<{ Bindings: Env }>();

categories.get("/", async (c) => {
  const sql = neon(c.env.DATABASE_URL);

  const rows = await sql`
    SELECT
      cat.id,
      cat.name,
      cat.description,
      cat.card_count,
      cat.last_reorganized_at,
      cat.created_at,
      COUNT(cards.id)::int AS count
    FROM categories cat
    LEFT JOIN cards ON cards.category_id = cat.id
    GROUP BY cat.id, cat.name, cat.description, cat.card_count,
             cat.last_reorganized_at, cat.created_at
    ORDER BY cat.name
  ` as CategoryRow[];

  return c.json(rows);
});

export default categories;
