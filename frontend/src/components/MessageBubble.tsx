import type { MessageRow } from "../api/types";

interface MessageBubbleProps {
  message: MessageRow;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const label = isUser ? "You" : "Claude";
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] ${isUser ? "bg-user-bubble" : "bg-assistant-bubble"} rounded-lg px-4 py-3`}>
        <div className="mb-1 flex items-center gap-2 text-xs text-text-tertiary">
          <span>{label}</span>
          <span>{time}</span>
        </div>
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">
          {message.content}
        </div>
      </div>
    </div>
  );
}
