import { useEffect, useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Customer } from "@/types/database";

interface CustomerAutocompleteSelectProps {
  id: string;
  customers: Customer[];
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onValueChange: (value: string) => void;
}

interface CustomerOption {
  id: string;
  name: string;
  customerCode: string;
  label: string;
  searchText: string;
}

const MAX_VISIBLE_RESULTS = 50;

const toCustomerOption = (customer: Customer): CustomerOption => {
  const id = customer.id.toString();
  const name = customer.name.trim() || `Customer ${id}`;
  const customerCode = customer.customer_id?.trim() ?? "";
  const label = customerCode ? `${name} (${customerCode})` : name;
  const searchText = `${name} ${customerCode} ${id}`.toLowerCase();

  return {
    id,
    name,
    customerCode,
    label,
    searchText,
  };
};

export const CustomerAutocompleteSelect = ({
  id,
  customers,
  value,
  disabled = false,
  placeholder = "Search by customer name or ID",
  onValueChange,
}: CustomerAutocompleteSelectProps) => {
  const listId = useId();
  const options = useMemo(
    () =>
      customers
        .map(toCustomerOption)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customers],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedOption) {
      setSearchTerm(selectedOption.label);
      return;
    }

    if (!value) {
      setSearchTerm("");
    }
  }, [selectedOption, value]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return selectedOption ? [selectedOption] : [];
    }

    return options
      .filter((option) => option.searchText.includes(query))
      .slice(0, MAX_VISIBLE_RESULTS);
  }, [options, searchTerm, selectedOption]);

  const handleSearchChange = (nextValue: string) => {
    setSearchTerm(nextValue);

    const trimmed = nextValue.trim();
    if (!trimmed) {
      onValueChange("");
      return;
    }

    const normalized = trimmed.toLowerCase();
    const exactMatch = options.find(
      (option) =>
        option.label.toLowerCase() === normalized ||
        option.name.toLowerCase() === normalized ||
        option.customerCode.toLowerCase() === normalized ||
        option.id === trimmed,
    );

    if (exactMatch) {
      onValueChange(exactMatch.id);
    }
  };

  const handleSelectChange = (nextValue: string) => {
    onValueChange(nextValue);

    if (!nextValue) {
      setSearchTerm("");
      return;
    }

    const option = options.find((item) => item.id === nextValue);
    setSearchTerm(option?.label ?? "");
  };

  const handleBlur = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      onValueChange("");
      setSearchTerm("");
      return;
    }

    const normalized = trimmed.toLowerCase();
    const exactMatch = options.find(
      (option) =>
        option.label.toLowerCase() === normalized ||
        option.name.toLowerCase() === normalized ||
        option.customerCode.toLowerCase() === normalized ||
        option.id === trimmed,
    );

    if (exactMatch) {
      handleSelectChange(exactMatch.id);
      return;
    }

    if (selectedOption) {
      setSearchTerm(selectedOption.label);
      return;
    }

    onValueChange("");
    setSearchTerm("");
  };

  return (
    <>
      <Input
        id={id}
        list={listId}
        value={searchTerm}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => handleSearchChange(event.target.value)}
        onBlur={handleBlur}
      />
      <datalist id={listId}>
        {filteredOptions.map((option) => (
          <option key={option.id} value={option.label} />
        ))}
      </datalist>
    </>
  );
};
