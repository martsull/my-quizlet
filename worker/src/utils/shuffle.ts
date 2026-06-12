import { CardRow } from "../types";

export function weightedShuffle(cards: CardRow[]): CardRow[] {
  const items = cards.map((card) => ({
    card,
    weight: 1 + Math.floor(card.difficulty / 2),
  }));

  const result: CardRow[] = [];

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
