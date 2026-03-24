import { useState, useCallback } from "react";

interface TagInputProps {
  tags: string[];
  onUpdate: (tags: string[]) => void;
}

export function TagInput({ tags, onUpdate }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        onUpdate([...tags, tag]);
      }
      setInput("");
    },
    [tags, onUpdate],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onUpdate(tags.filter((t) => t !== tag));
    },
    [tags, onUpdate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(input);
      }
    },
    [input, addTag],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // If user types a comma, add the tag immediately
      if (val.includes(",")) {
        addTag(val.replace(",", ""));
      } else {
        setInput(val);
      }
    },
    [addTag],
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 text-text-tertiary hover:text-text-primary"
            aria-label={`Remove tag ${tag}`}
          >
            x
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Add tags..." : ""}
        className="min-w-[60px] flex-1 bg-transparent text-xs text-text-secondary outline-none placeholder:text-text-tertiary"
      />
    </div>
  );
}
