import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar/SearchBar";
import { useSearch } from "../hooks/useSearch";
import { Card } from "../types";

function CardRow({ card }: { card: Card }) {
  return (
    <div className="card-row">
      <div className="card-row__main">
        <span className="card-row__english">{card.english}</span>
        {card.pronunciation && (
          <span className="card-row__pronunciation">/{card.pronunciation}/</span>
        )}
      </div>
      <div className="card-row__secondary">
        <span className="card-row__russian">{card.russian}</span>
        {card.categoryName && (
          <span className="badge badge--ok">{card.categoryName}</span>
        )}
      </div>
      {card.difficulty > 0 && (
        <div className="card-row__difficulty">
          {"🔥".repeat(Math.min(card.difficulty, 5))}
        </div>
      )}
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = useSearch(query);

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back
        </button>
        <h1 className="page-title">Search</h1>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search words, translations, categories…"
      />

      <div className="search-results">
        {isFetching && query && (
          <div className="loading-spinner loading-spinner--small" />
        )}

        {!isFetching && query && results && results.length === 0 && (
          <div className="empty-state">No results for &ldquo;{query}&rdquo;</div>
        )}

        {results?.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
