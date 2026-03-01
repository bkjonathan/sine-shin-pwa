import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OrderFiltersBarProps {
  searchQuery: string;
  statusFilter: string;
  sourceFilter: string;
  statusOptions: string[];
  sourceOptions: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onClear: () => void;
}

const selectClassName =
  "focus-visible:border-ring focus-visible:ring-ring/50 border-white/60 dark:border-white/25 h-10 w-full rounded-xl border bg-white/48 dark:bg-slate-900/45 px-3.5 text-sm shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] dark:shadow-[0_14px_30px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl outline-none focus-visible:ring-[3px]";

export const OrderFiltersBar = ({
  searchQuery,
  statusFilter,
  sourceFilter,
  statusOptions,
  sourceOptions,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onClear,
}: OrderFiltersBarProps) => {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
          placeholder="Search order id, status, source..."
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        className={selectClassName}
      >
        <option value="all">All Statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        value={sourceFilter}
        onChange={(event) => onSourceChange(event.target.value)}
        className={selectClassName}
      >
        <option value="all">All Sources</option>
        {sourceOptions.map((source) => (
          <option key={source} value={source}>
            {source}
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
