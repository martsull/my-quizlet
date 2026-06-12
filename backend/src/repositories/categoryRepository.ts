import { Category, Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";

export const categoryRepository = {
  async findAll(): Promise<(Category & { _count: { cards: number } })[]> {
    return prisma.category.findMany({
      include: { _count: { select: { cards: true } } },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  },

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { name } });
  },

  async findByNameInsensitive(name: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  },

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  async upsert(name: string, description?: string): Promise<Category> {
    return prisma.category.upsert({
      where: { name },
      create: { name, description },
      update: {},
    });
  },

  async update(
    id: string,
    data: Prisma.CategoryUpdateInput
  ): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },

  async syncCardCounts(): Promise<void> {
    const counts = await prisma.card.groupBy({
      by: ["categoryId"],
      _count: { id: true },
    });

    await Promise.all(
      counts.map((c) =>
        c.categoryId
          ? prisma.category.update({
              where: { id: c.categoryId },
              data: { cardCount: c._count.id },
            })
          : Promise.resolve()
      )
    );

    await prisma.category.updateMany({
      where: {
        id: { notIn: counts.map((c) => c.categoryId).filter(Boolean) as string[] },
      },
      data: { cardCount: 0 },
    });
  },
};
