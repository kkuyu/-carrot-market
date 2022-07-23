import ChatMessage, { ChatMessageItem, ChatMessageProps } from "@components/cards/chatMessage";
import useUser from "@libs/client/useUser";

interface ChatMessageListProps {
  list: ChatMessageItem[];
}

const ChatMessageList = ({ list }: ChatMessageListProps) => {
  const { user } = useUser();

  return (
    <div className="space-y-2.5">
      {list.map((item, index) => {
        const currentDate = new Date(item.createdAt).toISOString().replace(/T.*$/, "");
        const beforeDate = index === 0 ? "" : new Date(list[index - 1].createdAt).toISOString().replace(/T.*$/, "");
        return <ChatMessage key={item.id} item={item} direction={item.user.id === user?.id ? "forward" : "reverse"} isDifferentDate={currentDate !== beforeDate} currentDate={currentDate} />;
      })}
    </div>
  );
};

export default ChatMessageList;
