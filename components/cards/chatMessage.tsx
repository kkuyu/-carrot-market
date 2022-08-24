import type { HTMLAttributes } from "react";
// @api
import { GetChatsDetailResponse } from "@api/chats/[id]";

export type ChatMessageItem = GetChatsDetailResponse["chat"]["chatMessages"][number];

export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
  item: ChatMessageItem;
  direction: "forward" | "reverse";
  isDifferentDate: boolean;
  currentDate: string;
}

const ChatMessage = (props: ChatMessageProps) => {
  const { item, direction, isDifferentDate, currentDate, className = "", ...restProps } = props;

  const createdDate = new Date(item.createdAt);

  return (
    <>
      {isDifferentDate && (
        <span key={`${item.id}-${currentDate}`} className="block pt-2 text-center text-sm text-gray-500">
          {currentDate}
        </span>
      )}
      <div className={`flex items-end justify-end ${direction === "forward" ? "flex-row" : direction === "reverse" ? "flex-row-reverse" : ""} ${className}`} {...restProps}>
        <span className="flex-none px-2 py-0.5 text-sm text-gray-500">{createdDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
        <p className={`px-2.5 py-1.5 rounded-xl ${direction === "forward" ? "text-white bg-orange-500" : direction === "reverse" ? "bg-gray-200" : ""}`}>{item.text}</p>
      </div>
    </>
  );
};

export default ChatMessage;
