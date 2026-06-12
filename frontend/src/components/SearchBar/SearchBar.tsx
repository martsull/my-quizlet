import { ChangeEvent, useCallback } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search…" }: SearchBarProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="search"
        className="search-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {value && (
        <button className="search-clear" onClick={() => onChange("")} aria-label="Clear">
          ✕
        </button>
      )}
    </div>
  );
}
