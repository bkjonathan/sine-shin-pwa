import { useId, useMemo } from "react";

import { Input } from "@/components/ui/input";

interface CityAutocompleteInputProps {
  id: string;
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

const normalizeCityOptions = (options: string[]) => {
  const unique = new Map<string, string>();

  options.forEach((option) => {
    const trimmed = option.trim();
    if (!trimmed) {
      return;
    }

    const key = trimmed.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, trimmed);
    }
  });

  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};

export const CityAutocompleteInput = ({
  id,
  value,
  options,
  placeholder = "Bangkok",
  disabled = false,
  onValueChange,
}: CityAutocompleteInputProps) => {
  const listId = useId();
  const normalizedOptions = useMemo(() => normalizeCityOptions(options), [options]);

  return (
    <>
      <Input
        id={id}
        list={listId}
        value={value}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <datalist id={listId}>
        {normalizedOptions.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </>
  );
};
