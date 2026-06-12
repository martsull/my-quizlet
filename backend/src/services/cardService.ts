import { cardRepository, CardWithCategory } from "../repositories/cardRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { CardDto } from "../types";

function toDto(card: CardWithCategory): CardDto {
  return {
    id: card.id,
    english: card.english,
    russian: card.russian,
    pronunciation: card.pronunciation,
    exampleEn: card.exampleEn,
    exampleRu: card.exampleRu,
    categoryId: card.categoryId,
    categoryName: card.category?.name ?? null,
    difficulty: card.difficulty,
    successCount: card.successCount,
    failureCount: card.failureCount,
    lastReviewedAt: card.lastReviewedAt,
    createdAt: card.createdAt,
  };
}

function weightedShuffle(cards: CardDto[]): CardDto[] {
  const items = cards.map((card) => ({
    card,
    weight: 1 + Math.floor(card.difficulty / 2),
  }));

  const result: CardDto[] = [];

  while (items.length > 0) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    let idx = items.length - 1;

    for (let i = 0; i < items.length; i++) {
      rand -= items[i].weight;
      if (rand <= 0) {
        idx = i;
        break;
      }
    }

    result.push(items[idx].card);
    items.splice(idx, 1);
  }

  return result;
}

export const cardService = {
  async getCards(params: { categoryId?: string }): Promise<CardDto[]> {
    const cards = await cardRepository.findMany({
      categoryId: params.categoryId,
    });
    return weightedShuffle(cards.map(toDto));
  },

  async getDifficultCards(): Promise<CardDto[]> {
    const cards = await cardRepository.findMany({ minDifficulty: 4 });
    return cards
      .map(toDto)
      .sort((a, b) => b.difficulty - a.difficulty);
  },

  async searchCards(query: string): Promise<CardDto[]> {
    if (!query.trim()) return [];
    const cards = await cardRepository.search(query);
    return cards.map(toDto);
  },

  async reviewCard(id: string, known: boolean): Promise<CardDto> {
    const card = await cardRepository.incrementReviewStats(id, known);
    if (card.categoryId) {
      await categoryRepository.syncCardCounts();
    }
    const updated = await cardRepository.findById(id);
    if (!updated) throw new Error("Card not found after update");
    return toDto(updated);
  },
};
