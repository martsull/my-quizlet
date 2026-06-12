import { Category } from "../../types";

interface CategoryCardProps {
  category: Category;
  onClick: (category: Category) => void;
}

function difficultyColor(count: number): string {
  if (count < 10) return "badge--warn";
  if (count > 50) return "badge--danger";
  return "badge--ok";
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <button
      className="category-card"
      onClick={() => onClick(category)}
      aria-label={`Study ${category.name}`}
    >
      <div className="category-card__body">
        <span className="category-card__name">{category.name}</span>
        {category.description && (
          <span className="category-card__desc">{category.description}</span>
        )}
      </div>
      <span className={`badge ${difficultyColor(category.count)}`}>
        {category.count}
      </span>
    </button>
  );
}
