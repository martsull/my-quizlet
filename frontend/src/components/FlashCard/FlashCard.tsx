import { useState, useEffect } from "react";
import { Card } from "../../types";

interface FlashCardProps {
  card: Card;
  onKnown: () => void;
  onUnknown: () => void;
}

export function FlashCard({ card, onKnown, onUnknown }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setFlipped(false);
  }, [card.id]);

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard ${flipped ? "flashcard--flipped" : ""}`}
        onClick={() => !flipped && setFlipped(true)}
        role="button"
        aria-label={flipped ? "Card back" : "Tap to reveal translation"}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !flipped && setFlipped(true)}
      >
        <div className="flashcard__face flashcard__face--front">
          <div className="flashcard__word">{card.english}</div>
          {card.difficulty > 0 && (
            <div className="flashcard__difficulty">
              {"🔥".repeat(Math.min(card.difficulty, 5))}
            </div>
          )}
          <div className="flashcard__hint">Tap to reveal</div>
        </div>

        <div className="flashcard__face flashcard__face--back">
          <div className="flashcard__word flashcard__word--russian">
            {card.russian}
          </div>
          {card.pronunciation && (
            <div className="flashcard__pronunciation">
              /{card.pronunciation}/
            </div>
          )}
          {(card.exampleEn || card.exampleRu) && (
            <div className="flashcard__examples">
              {card.exampleEn && (
                <p className="flashcard__example flashcard__example--en">
                  {card.exampleEn}
                </p>
              )}
              {card.exampleRu && (
                <p className="flashcard__example flashcard__example--ru">
                  {card.exampleRu}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flashcard-actions">
        <button
          className="btn btn--danger"
          onClick={onUnknown}
          aria-label="I don't know this word"
        >
          I Don&apos;t Know
        </button>
        <button
          className="btn btn--success"
          onClick={onKnown}
          aria-label="I know this word"
        >
          I Know
        </button>
      </div>
    </div>
  );
}
