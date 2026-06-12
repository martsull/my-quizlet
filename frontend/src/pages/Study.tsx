import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCards, useDifficultCards } from "../hooks/useCards";
import { useStudySession } from "../hooks/useStudySession";
import { FlashCard } from "../components/FlashCard/FlashCard";
import { ProgressBar } from "../components/ProgressBar/ProgressBar";
import { Card } from "../types";

function ActiveSession({
  cards,
  title,
}: {
  readonly cards: Card[];
  readonly title: string;
}) {
  const navigate = useNavigate();
  const session = useStudySession(cards);

  if (session.isComplete) {
    return (
      <div className="page page--centered">
        <div className="completion-screen">
          <div className="completion-icon">🎉</div>
          <h2 className="completion-title">Level Complete!</h2>
          <p className="completion-subtitle">
            You learned {session.knownCount} cards.
          </p>
          <div className="completion-actions">
            <button
              className="btn btn--primary"
              onClick={() => session.restart(cards)}
            >
              Repeat
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => navigate("/")}
            >
              Back to Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--study">
      <header className="study-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h2 className="study-title">{title}</h2>
        <span className="study-remaining">{session.queue.length} left</span>
      </header>

      <ProgressBar current={session.knownCount} total={session.totalCards} />

      {session.currentCard && (
        <FlashCard
          card={session.currentCard}
          onKnown={session.markKnown}
          onUnknown={session.markUnknown}
        />
      )}
    </div>
  );
}

function SessionLoader({
  categoryId,
  mode,
  title,
}: {
  readonly categoryId?: string;
  readonly mode?: string;
  readonly title: string;
}) {
  const navigate = useNavigate();

  const allCardsQuery = useCards(mode === "difficult" ? undefined : categoryId);
  const difficultQuery = useDifficultCards();

  const { data: cards, isLoading, error } =
    mode === "difficult" ? difficultQuery : allCardsQuery;

  const stableCards = useMemo(() => cards ?? [], [cards]);

  if (isLoading) {
    return (
      <div className="page page--centered">
        <div className="loading-spinner" />
        <p className="loading-text">Loading cards…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page page--centered">
        <div className="error-state">
          <p>Failed to load cards.</p>
          <button className="btn btn--primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (stableCards.length === 0) {
    return (
      <div className="page page--centered">
        <div className="empty-state">
          <p>No cards found.</p>
          <button className="btn btn--primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <ActiveSession cards={stableCards} title={title} />;
}

export function StudyPage() {
  const [params] = useSearchParams();
  const categoryId = params.get("categoryId") ?? undefined;
  const mode = params.get("mode") ?? undefined;
  const title = params.get("title") ?? "Study";

  return <SessionLoader categoryId={categoryId} mode={mode} title={title} />;
}
