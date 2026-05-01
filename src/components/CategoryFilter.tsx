'use client'

import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "category-pill",
          selectedCategory === null && "category-pill-active"
        )}
      >
        🔥 All Markets
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "category-pill",
            selectedCategory === category.id && "category-pill-active"
          )}
        >
          {category.icon} {category.name}
        </button>
      ))}
    </div>
  );
}
