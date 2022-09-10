import type { HTMLAttributes } from "react";
// @api
import { GetChatsDetailResponse } from "@api/chats/[id]";

export type ChatMessageItem = GetChatsDetailResponse["chat"]["chatMessages"][number];

export interface ChatMessageProps extends HTMLAttributes<HTMLDivElement> {
  item: ChatMessageItem;
  direction: "forward" | "reverse";
  isVisibleDate?: boolean;
}

const ChatMessage = (props: ChatMessageProps) => {
  const { item, direction, isVisibleDate = false, className = "", ...restProps } = props;

  return (
    <>
      {isVisibleDate && (
        <span key={item.createdAt.toString()} className="block pt-2 text-center text-sm text-gray-500">
          {new Date(item?.createdAt).toISOString().replace(/T.*$/, "")}
        </span>
      )}
      <div className={`flex items-end justify-end ${direction === "forward" ? "flex-row" : "flex-row-reverse"} ${className}`} {...restProps}>
        <span className="flex-none px-2 py-0.5 text-sm text-gray-500">{new Date(item.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
        <p className={`px-2.5 py-1.5 rounded-xl ${direction === "forward" ? "text-white bg-orange-500" : "bg-gray-200"}`}>{item.text}</p>
      </div>
    </>
  );
};

export default ChatMessage;
