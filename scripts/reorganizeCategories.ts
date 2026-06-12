/**
 * Usage: npx ts-node reorganizeCategories.ts
 *
 * Analyses all categories and cards with AI, then:
 *   - Splits categories with > 60 cards into subcategories
 *   - Merges categories with < 10 cards into nearest peers
 *   - Leaves well-sized categories (10–60) unchanged
 *
 * Env vars required: DATABASE_URL, GROQ_API_KEY
 */

import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

// ── Types ────────────────────────────────────────────────────────────────────

interface CategoryInfo {
  id: string;
  name: string;
  cardCount: number;
  sampleWords: string[];
}

interface SplitInstruction {
  action: "split";
  categoryName: string;
  subcategories: {
    name: string;
    cardIds: string[];
  }[];
}

interface MergeInstruction {
  action: "merge";
  fromCategory: string;
  intoCategory: string;
}

interface KeepInstruction {
  action: "keep";
  categoryName: string;
}

type Instruction = SplitInstruction | MergeInstruction | KeepInstruction;

interface CardSnapshot {
  id: string;
  english: string;
  categoryId: string | null;
  categoryName: string | null;
}

interface ReorganizeReport {
  created: string[];
  merged: { from: string; into: string }[];
  split: { category: string; into: string[] }[];
  unchanged: string[];
}

// ── Prompts ──────────────────────────────────────────────────────────────────

function buildAnalysisPrompt(
  categories: CategoryInfo[],
  cards: CardSnapshot[]
): string {
  const catList = categories
    .map(
      (c) =>
        `  - "${c.name}" (${c.cardCount} cards): ${c.sampleWords.slice(0, 6).join(", ")}`
    )
    .join("\n");

  return `You are a vocabulary organiser. Analyse these vocabulary categories and return
a JSON array of instructions to optimise them.

Target size: 20–40 cards per category.
Merge threshold: < 10 cards → merge into the nearest related category.
Split threshold: > 60 cards → split into 2–4 focused subcategories.
Keep range: 10–60 cards → keep unchanged.

Categories:
${catList}

Rules:
1. For SPLIT: list the new subcategory names and the card IDs that go into each.
   Card IDs are provided below. Every card from the split category must appear
   in exactly one subcategory.
2. For MERGE: provide fromCategory (disappears) and intoCategory (receives cards).
   intoCategory must be an existing category name or one being created by a split.
3. For KEEP: just acknowledge it.
4. Subcategory names must be English, 2–4 words, title-cased.
5. Return ONLY a valid JSON array with objects of shape:
   { action: "split", categoryName, subcategories: [{name, cardIds:[]}] }
   { action: "merge", fromCategory, intoCategory }
   { action: "keep",  categoryName }

All cards (id | category | english):
${cards
  .map((c) => `  ${c.id} | ${c.categoryName ?? "uncategorised"} | ${c.english}`)
  .join("\n")}

Respond ONLY with valid JSON. No markdown. No explanation.`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

  await prisma.category.updateMany({
    where: {
      id: {
        notIn: counts
          .map((c) => c.categoryId)
          .filter((id): id is string => id !== null),
      },
    },
    data: { cardCount: 0 },
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    // Load snapshot
    const rawCats = await prisma.category.findMany({
      include: {
        _count: { select: { cards: true } },
        cards: { select: { english: true }, take: 10 },
      },
    });

    const categories: CategoryInfo[] = rawCats.map((c) => ({
      id: c.id,
      name: c.name,
      cardCount: c._count.cards,
      sampleWords: c.cards.map((card) => card.english),
    }));

    const rawCards = await prisma.card.findMany({
      select: {
        id: true,
        english: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    const cards: CardSnapshot[] = rawCards.map((c) => ({
      id: c.id,
      english: c.english,
      categoryId: c.categoryId,
      categoryName: c.category?.name ?? null,
    }));

    if (categories.length === 0) {
      console.log("No categories found. Nothing to reorganise.");
      return;
    }

    console.log(
      `Analysing ${categories.length} categories and ${cards.length} cards with AI…\n`
    );

    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "user",
          content: buildAnalysisPrompt(categories, cards),
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";

    let instructions: Instruction[];
    try {
      instructions = JSON.parse(content) as Instruction[];
    } catch {
      console.error("Failed to parse Groq response:\n", content);
      throw new Error("Invalid JSON from Groq");
    }

    const report: ReorganizeReport = {
      created: [],
      merged: [],
      split: [],
      unchanged: [],
    };

    // Build category name→id map
    const catMap = new Map(categories.map((c) => [c.name, c.id]));

    // Process instructions
    for (const instruction of instructions) {
      if (instruction.action === "keep") {
        report.unchanged.push(instruction.categoryName);
        continue;
      }

      if (instruction.action === "merge") {
        const fromId = catMap.get(instruction.fromCategory);
        let intoId = catMap.get(instruction.intoCategory);

        if (!fromId) {
          console.warn(`  SKIP merge: "${instruction.fromCategory}" not found`);
          continue;
        }

        if (!intoId) {
          // Create the target category if it doesn't exist
          const newCat = await prisma.category.create({
            data: { name: instruction.intoCategory },
          });
          intoId = newCat.id;
          catMap.set(instruction.intoCategory, intoId);
          report.created.push(instruction.intoCategory);
        }

        await prisma.card.updateMany({
          where: { categoryId: fromId },
          data: { categoryId: intoId },
        });

        await prisma.category.delete({ where: { id: fromId } });
        catMap.delete(instruction.fromCategory);

        report.merged.push({
          from: instruction.fromCategory,
          into: instruction.intoCategory,
        });

        console.log(
          `  Merged: "${instruction.fromCategory}" → "${instruction.intoCategory}"`
        );
        continue;
      }

      if (instruction.action === "split") {
        const sourceId = catMap.get(instruction.categoryName);
        if (!sourceId) {
          console.warn(
            `  SKIP split: "${instruction.categoryName}" not found`
          );
          continue;
        }

        const subNames: string[] = [];

        for (const sub of instruction.subcategories) {
          if (!sub.cardIds || sub.cardIds.length === 0) continue;

          let subId = catMap.get(sub.name);
          if (!subId) {
            const newCat = await prisma.category.create({
              data: { name: sub.name },
            });
            subId = newCat.id;
            catMap.set(sub.name, subId);
            report.created.push(sub.name);
          }

          await prisma.card.updateMany({
            where: { id: { in: sub.cardIds } },
            data: { categoryId: subId },
          });

          subNames.push(sub.name);
          console.log(
            `  Split: ${sub.cardIds.length} cards → "${sub.name}"`
          );
        }

        // Remove source if all cards have been moved
        const remaining = await prisma.card.count({
          where: { categoryId: sourceId },
        });
        if (remaining === 0) {
          await prisma.category.delete({ where: { id: sourceId } });
          catMap.delete(instruction.categoryName);
        }

        report.split.push({
          category: instruction.categoryName,
          into: subNames,
        });
      }
    }

    // Mark reorganised categories
    await prisma.category.updateMany({
      where: {
        name: { in: [...report.created, ...report.split.flatMap((s) => s.into)] },
      },
      data: { lastReorganizedAt: new Date() },
    });

    await syncCardCounts(prisma);

    printReport(report);
  } finally {
    await prisma.$disconnect();
  }
}

function printReport(report: ReorganizeReport): void {
  console.log("\n─────────────────────────────────");
  console.log("Reorganisation complete.\n");

  if (report.created.length > 0) {
    console.log("Created categories:");
    report.created.forEach((c) => console.log(`  + ${c}`));
  }

  if (report.merged.length > 0) {
    console.log("\nMerged:");
    report.merged.forEach((m) => console.log(`  ${m.from} → ${m.into}`));
  }

  if (report.split.length > 0) {
    console.log("\nSplit:");
    report.split.forEach((s) =>
      console.log(`  ${s.category} → [${s.into.join(", ")}]`)
    );
  }

  if (report.unchanged.length > 0) {
    console.log(`\nUnchanged: ${report.unchanged.length} categories`);
  }

  console.log("─────────────────────────────────\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
