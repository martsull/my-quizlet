import { useNavigate } from "react-router-dom";
import { useCategories } from "../hooks/useCategories";
import { CategoryCard } from "../components/CategoryCard/CategoryCard";
import { Category } from "../types";

export function HomePage() {
  const navigate = useNavigate();
  const { data: categories, isLoading, error } = useCategories();

  const handleCategory = (cat: Category) => {
    navigate(`/study?categoryId=${cat.id}&title=${encodeURIComponent(cat.name)}`);
  };

  const handleStudyAll = () => navigate("/study?title=All%20Cards");
  const handleDifficult = () => navigate("/study?mode=difficult&title=Difficult%20Words");

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <p>Failed to load categories.</p>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">My Quizlet</h1>
        <p className="page-subtitle">
          {categories?.reduce((sum, c) => sum + c.count, 0) ?? 0} cards total
        </p>
      </header>

      <section className="section">
        <h2 className="section-title">Quick Start</h2>
        <div className="quick-actions">
          <button className="quick-action-btn quick-action-btn--primary" onClick={handleStudyAll}>
            <span className="quick-action-icon">📚</span>
            <span>Study All Cards</span>
          </button>
          <button className="quick-action-btn quick-action-btn--danger" onClick={handleDifficult}>
            <span className="quick-action-icon">🔥</span>
            <span>Review Difficult</span>
          </button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Categories</h2>
        {categories && categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet. Run the import script to add words.</p>
          </div>
        ) : (
          <div className="category-list">
            {categories?.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onClick={handleCategory} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
