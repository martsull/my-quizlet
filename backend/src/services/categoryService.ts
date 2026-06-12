import { categoryRepository } from "../repositories/categoryRepository";
import { CategoryWithCount } from "../types";

export const categoryService = {
  async getAll(): Promise<CategoryWithCount[]> {
    const categories = await categoryRepository.findAll();
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      count: cat._count.cards,
      lastReorganizedAt: cat.lastReorganizedAt,
      createdAt: cat.createdAt,
    }));
  },
};
