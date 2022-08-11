import ChatMessage, { ChatMessageItem, ChatMessageProps } from "@components/cards/chatMessage";
import useUser from "@libs/client/useUser";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  list: ChatMessageItem[];
}

const ChatMessageList = (props: ChatMessageListProps) => {
  const { list, className = "", ...restProps } = props;
  const { user } = useUser();

  if (!Boolean(list.length)) return null;

  return (
    <div className={`space-y-2.5 ${className}`} {...restProps}>
      {list.map((item, index) => {
        const currentDate = new Date(item.createdAt).toISOString().replace(/T.*$/, "");
        const beforeDate = index === 0 ? "" : new Date(list[index - 1].createdAt).toISOString().replace(/T.*$/, "");
        return <ChatMessage key={item.id} item={item} direction={item.user.id === user?.id ? "forward" : "reverse"} isDifferentDate={currentDate !== beforeDate} currentDate={currentDate} />;
      })}
    </div>
  );
};

export default ChatMessageList;
