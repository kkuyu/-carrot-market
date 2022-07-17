import { GetChatsDetailResponse } from "@api/chats/[id]";

type ChatMessageItem = GetChatsDetailResponse["chat"]["chatMessages"][0];

interface ChatMessageProps {
  item: ChatMessageItem;
  direction: "forward" | "reverse";
}

const ChatMessage = ({ item, direction }: ChatMessageProps) => {
  const createdDate = new Date(item.createdAt);

  return (
    <div className={`flex items-end justify-end ${direction === "forward" ? "flex-row" : direction === "reverse" ? "flex-row-reverse" : ""}`}>
      <span className="flex-none px-2 py-0.5 text-sm text-gray-500">{createdDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
      <p className={`px-2.5 py-1.5 rounded-xl ${direction === "forward" ? "text-white bg-orange-500" : direction === "reverse" ? "bg-gray-200" : ""}`}>{item.text}</p>
    </div>
  );
};

export default ChatMessage;
