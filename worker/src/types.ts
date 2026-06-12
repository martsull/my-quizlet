export interface Env {
  DATABASE_URL: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  card_count: number;
  last_reorganized_at: string | null;
  created_at: string;
  count: number;
}

export interface CardRow {
  id: string;
  english: string;
  russian: string;
  pronunciation: string | null;
  example_en: string | null;
  example_ru: string | null;
  category_id: string | null;
  category_name: string | null;
  difficulty: number;
  success_count: number;
  failure_count: number;
  last_reviewed_at: string | null;
  created_at: string;
}
