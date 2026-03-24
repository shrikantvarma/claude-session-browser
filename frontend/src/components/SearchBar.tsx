import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchBar({ onSearch, initialQuery = "" }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search sessions..."
        className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-2 pl-9 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none"
      />
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    </div>
  );
}
