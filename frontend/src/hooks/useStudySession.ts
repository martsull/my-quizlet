import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "../types";
import { api } from "../services/api";

interface SessionState {
  queue: Card[];
  knownIds: Set<string>;
  totalCards: number;
  isComplete: boolean;
}

function reinsertCard(queue: Card[], card: Card): Card[] {
  const insertAt = Math.min(3, queue.length);
  const next = [...queue];
  next.splice(insertAt, 0, card);
  return next;
}

export function useStudySession(initialCards: Card[]) {
  const [state, setState] = useState<SessionState>({
    queue: initialCards,
    knownIds: new Set(),
    totalCards: initialCards.length,
    isComplete: initialCards.length === 0,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, known }: { id: string; known: boolean }) =>
      api.reviewCard(id, known),
  });

  const currentCard = state.queue[0] ?? null;

  const markKnown = useCallback(() => {
    if (!currentCard) return;

    reviewMutation.mutate({ id: currentCard.id, known: true });

    setState((prev) => {
      const [, ...rest] = prev.queue;
      const knownIds = new Set(prev.knownIds).add(currentCard.id);
      return {
        ...prev,
        queue: rest,
        knownIds,
        isComplete: rest.length === 0,
      };
    });
  }, [currentCard, reviewMutation]);

  const markUnknown = useCallback(() => {
    if (!currentCard) return;

    reviewMutation.mutate({ id: currentCard.id, known: false });

    setState((prev) => {
      const [, ...rest] = prev.queue;
      return {
        ...prev,
        queue: reinsertCard(rest, currentCard),
      };
    });
  }, [currentCard, reviewMutation]);

  const restart = useCallback((cards: Card[]) => {
    setState({
      queue: cards,
      knownIds: new Set(),
      totalCards: cards.length,
      isComplete: cards.length === 0,
    });
  }, []);

  return {
    currentCard,
    queue: state.queue,
    knownCount: state.knownIds.size,
    totalCards: state.totalCards,
    isComplete: state.isComplete,
    markKnown,
    markUnknown,
    restart,
  };
}
