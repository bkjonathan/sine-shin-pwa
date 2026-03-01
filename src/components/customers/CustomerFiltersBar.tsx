import { FilterX, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerFiltersBarProps {
  searchQuery: string;
  cityFilter: string;
  platformFilter: string;
  cityOptions: string[];
  platformOptions: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onClear: () => void;
}

const selectClassName =
  "focus-visible:border-ring focus-visible:ring-ring/50 border-white/60 h-10 w-full rounded-xl border bg-white/48 px-3.5 text-sm shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] backdrop-blur-xl outline-none focus-visible:ring-[3px]";

export const CustomerFiltersBar = ({
  searchQuery,
  cityFilter,
  platformFilter,
  cityOptions,
  platformOptions,
  hasActiveFilters,
  onSearchChange,
  onCityChange,
  onPlatformChange,
  onClear,
}: CustomerFiltersBarProps) => {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-10"
          placeholder="Search name, code, phone, city, platform..."
        />
      </div>

      <select
        value={cityFilter}
        onChange={(event) => onCityChange(event.target.value)}
        className={selectClassName}
      >
        <option value="all">All Cities</option>
        {cityOptions.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <select
        value={platformFilter}
        onChange={(event) => onPlatformChange(event.target.value)}
        className={selectClassName}
      >
        <option value="all">All Platforms</option>
        {platformOptions.map((platform) => (
          <option key={platform} value={platform}>
            {platform}
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
