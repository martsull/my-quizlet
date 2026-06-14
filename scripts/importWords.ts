/**
 * Usage: npx ts-node importWords.ts words.txt
 *
 * Reads a plain-text word list (one word/phrase per line), sends them to
 * Groq for translation + categorisation, then upserts into the database.
 *
 * Env vars required: DATABASE_URL, GROQ_API_KEY
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

// ── Types ────────────────────────────────────────────────────────────────────

interface WordEntry {
  english: string;
  russian: string;
  pronunciation: string;
  exampleEn: string;
  exampleRu: string;
  category: string;
}

interface ImportReport {
  added: string[];
  skipped: string[];
  createdCategories: string[];
  updatedCategories: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalise(word: string): string {
  return word.trim().toLowerCase().replace(/[^a-z0-9 '-]/g, "");
}

function isDuplicate(english: string, existing: string[]): boolean {
  const n = normalise(english);
  return existing.some((e) => {
    const en = normalise(e);
    if (n === en) return true;
    // strip trailing 's' to catch simple plural
    if (n === en + "s" || n + "s" === en) return true;
    // tradeoff vs trade-off vs trade off
    const plain = (s: string) => s.replace(/[-\s]/g, "");
    if (plain(n) === plain(en)) return true;
    return false;
  });
}

function buildPrompt(words: string[], categories: string[]): string {
  const catList =
    categories.length > 0
      ? categories.map((c) => `  - ${c}`).join("\n")
      : "  (none yet)";

  return `You are a vocabulary assistant. Given a list of English words or phrases,
return a JSON array where each element has exactly these fields:
  - english: the original word (keep original casing)
  - russian: accurate Russian translation
  - pronunciation: English phonetic pronunciation guide (e.g. "LAY-ten-see")
  - exampleEn: one natural English sentence using the word (max 15 words)
  - exampleRu: the Russian translation of exampleEn
  - category: category name (see strict rules below)

STRICT category rules — follow exactly:
  1. ALWAYS prefer an existing category over creating a new one.
     If a word can reasonably belong to an existing category, use it.
  2. Group words together aggressively. Do NOT create a separate category
     for each word. A category with 1–5 words is WRONG.
  3. Create a new category ONLY when none of the existing ones fit at all.
  4. When you must create a new category, make it broad enough to hold
     at least 15–30 words (think ahead — other words will be added later).
  5. Good categories: "Everyday English", "Tech Vocabulary",
     "Emotions And Personality", "Formal English", "Idioms And Phrases".
     Bad categories: "Adverbs", "Pronouns", "Colors", "Sleep" (too narrow).
  6. Category names: English, 2–4 words, title-cased.
  7. Maximum 6 total distinct categories across all words in this batch.

Existing categories (USE THESE FIRST):
${catList}

Words to process:
${words.map((w) => `  - ${w}`).join("\n")}

Respond ONLY with a valid JSON array. No markdown fences. No explanation.`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx ts-node importWords.ts <words.txt>");
    process.exit(1);
  }

  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absPath, "utf-8");

  // Support multiple formats:
  //   one word per line: latency\nthroughput
  //   comma-separated with any quotes: «word», "word", 'word', word
  const words = raw
    .split(/[\n,]+/)
    .map((w) => w.replace(/[«»"'`]/g, "").trim())
    .filter(Boolean);

  if (words.length === 0) {
    console.error("No words found in file.");
    process.exit(1);
  }

  console.log(`\nProcessing ${words.length} word(s)…\n`);

  const prisma = new PrismaClient();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    // Load existing data
    const existingCards = await prisma.card.findMany({
      select: { english: true },
    });
    const existingEnglish = existingCards.map((c) => c.english);

    const existingCats = await prisma.category.findMany({
      select: { id: true, name: true, _count: { select: { cards: true } } },
    });
    const existingCatNames = existingCats.map((c) => c.name);

    // Deduplicate input list before sending to AI
    const newWords = words.filter((w) => !isDuplicate(w, existingEnglish));
    const skippedBeforeAI = words.filter((w) =>
      isDuplicate(w, existingEnglish)
    );

    if (newWords.length === 0) {
      console.log("All words already exist. Nothing to import.");
      printReport({
        added: [],
        skipped: skippedBeforeAI,
        createdCategories: [],
        updatedCategories: [],
      });
      return;
    }

    // Send to Groq in batches of 30
    const BATCH = 30;
    const entries: WordEntry[] = [];

    for (let i = 0; i < newWords.length; i += BATCH) {
      const batch = newWords.slice(i, i + BATCH);
      console.log(
        `Calling Groq for batch ${Math.floor(i / BATCH) + 1} (${batch.length} words)…`
      );

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: buildPrompt(batch, existingCatNames),
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content ?? "[]";

      let parsed: WordEntry[];
      try {
        parsed = JSON.parse(content) as WordEntry[];
      } catch {
        console.error("Failed to parse Groq response:", content);
        throw new Error("Invalid JSON from Groq");
      }

      entries.push(...parsed);
    }

    // Upsert categories and insert cards
    const report: ImportReport = {
      added: [],
      skipped: [...skippedBeforeAI],
      createdCategories: [],
      updatedCategories: [],
    };

    const catCache = new Map<string, string>(); // name → id

    // Seed cache with existing
    for (const cat of existingCats) {
      catCache.set(cat.name, cat.id);
    }

    for (const entry of entries) {
      // Double-check duplicate (AI may have returned existing words)
      if (isDuplicate(entry.english, existingEnglish)) {
        report.skipped.push(entry.english);
        continue;
      }

      // Upsert category
      if (!catCache.has(entry.category)) {
        const cat = await prisma.category.upsert({
          where: { name: entry.category },
          create: { name: entry.category },
          update: {},
        });
        catCache.set(cat.name, cat.id);

        if (!existingCatNames.includes(entry.category)) {
          report.createdCategories.push(entry.category);
          existingCatNames.push(entry.category);
        }
      } else if (
        existingCatNames.includes(entry.category) &&
        !report.updatedCategories.includes(entry.category)
      ) {
        report.updatedCategories.push(entry.category);
      }

      const categoryId = catCache.get(entry.category)!;

      await prisma.card.create({
        data: {
          english: entry.english,
          russian: entry.russian,
          pronunciation: entry.pronunciation || null,
          exampleEn: entry.exampleEn || null,
          exampleRu: entry.exampleRu || null,
          categoryId,
        },
      });

      report.added.push(entry.english);
      existingEnglish.push(entry.english);
    }

    // Sync card counts
    await syncCardCounts(prisma);

    printReport(report);
  } finally {
    await prisma.$disconnect();
  }
}

async function syncCardCounts(prisma: PrismaClient): Promise<void> {
  const counts = await prisma.card.groupBy({
    by: ["categoryId"],
    _count: { id: true },
  });

  for (const row of counts) {
    if (row.categoryId) {
      await prisma.category.update({
        where: { id: row.categoryId },
        data: { cardCount: row._count.id },
      });
    }
  }
}

function printReport(report: ImportReport): void {
  console.log("\n─────────────────────────────────");
  console.log(`Imported: ${report.added.length}`);

  if (report.added.length > 0) {
    console.log("\nAdded:");
    report.added.forEach((w) => console.log(`  + ${w}`));
  }

  if (report.skipped.length > 0) {
    console.log("\nSkipped duplicates:");
    report.skipped.forEach((w) => console.log(`  ~ ${w}`));
  }

  if (report.createdCategories.length > 0) {
    console.log("\nCreated categories:");
    report.createdCategories.forEach((c) => console.log(`  * ${c}`));
  }

  if (report.updatedCategories.length > 0) {
    console.log("\nUpdated categories:");
    report.updatedCategories.forEach((c) => console.log(`  ~ ${c}`));
  }

  console.log("─────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
