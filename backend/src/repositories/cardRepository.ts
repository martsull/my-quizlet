import { Card, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";

export type CardWithCategory = Card & {
  category: { name: string } | null;
};

export const cardRepository = {
  async findMany(params: {
    categoryId?: string;
    minDifficulty?: number;
    limit?: number;
    offset?: number;
  }): Promise<CardWithCategory[]> {
    const where: Prisma.CardWhereInput = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.minDifficulty !== undefined)
      where.difficulty = { gte: params.minDifficulty };

    return prisma.card.findMany({
      where,
      include: { category: { select: { name: true } } },
      skip: params.offset,
      take: params.limit,
    });
  },

  async findById(id: string): Promise<CardWithCategory | null> {
    return prisma.card.findUnique({
      where: { id },
      include: { category: { select: { name: true } } },
    });
  },

  async search(query: string): Promise<CardWithCategory[]> {
    const q = query.toLowerCase().trim();
    return prisma.card.findMany({
      where: {
        OR: [
          { english: { contains: q, mode: "insensitive" } },
          { russian: { contains: q, mode: "insensitive" } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { category: { select: { name: true } } },
      take: 50,
      orderBy: { english: "asc" },
    });
  },

  async findByEnglishExact(english: string): Promise<Card | null> {
    return prisma.card.findFirst({
      where: { english: { equals: english, mode: "insensitive" } },
    });
  },

  async create(data: Prisma.CardCreateInput): Promise<Card> {
    return prisma.card.create({ data });
  },

  async update(id: string, data: Prisma.CardUpdateInput): Promise<Card> {
    return prisma.card.update({ where: { id }, data });
  },

  async incrementReviewStats(
    id: string,
    known: boolean
  ): Promise<Card> {
    return prisma.card.update({
      where: { id },
      data: {
        successCount: known ? { increment: 1 } : undefined,
        failureCount: !known ? { increment: 1 } : undefined,
        difficulty: !known ? { increment: 1 } : { decrement: 1 },
        lastReviewedAt: new Date(),
      },
    });
  },

  async findAll(): Promise<CardWithCategory[]> {
    return prisma.card.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async updateCategory(
    cardIds: string[],
    categoryId: string
  ): Promise<Prisma.BatchPayload> {
    return prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { categoryId },
    });
  },
};
