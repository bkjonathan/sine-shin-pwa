import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExpenseFiltersBarProps {
  searchQuery: string;
  categoryFilter: string;
  categoryOptions: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
}

const selectClassName =
  "focus-visible:border-ring focus-visible:ring-ring/50 border-white/60 dark:border-white/25 h-10 w-full rounded-xl border bg-white/48 dark:bg-slate-900/45 px-3.5 text-sm text-foreground dark:text-slate-100 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] dark:shadow-[0_14px_30px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl outline-none focus-visible:ring-[3px] [&>option]:bg-white [&>option]:text-slate-700 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100";

export const ExpenseFiltersBar = ({
  searchQuery,
  categoryFilter,
  categoryOptions,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onClear,
}: ExpenseFiltersBarProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
          placeholder="Search id, title, category, payment, notes..."
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(event) => onCategoryChange(event.target.value)}
        className={selectClassName}
      >
        <option value="all">All Categories</option>
        {categoryOptions.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="h-10"
      >
        <FilterX className="size-4" />
        Clear
      </Button>
    </div>
  );
};
