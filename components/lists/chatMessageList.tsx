import { Fragment, HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @components
import ChatMessage, { ChatMessageItem, ChatMessageProps } from "@components/cards/chatMessage";

interface ChatMessageListProps extends HTMLAttributes<HTMLDivElement> {
  list: ChatMessageItem[];
}

const ChatMessageList = (props: ChatMessageListProps) => {
  const { list, className = "", ...restProps } = props;
  const { user } = useUser();

  if (!Boolean(list.length)) return null;

  return (
    <div className={`space-y-2.5 ${className}`} {...restProps}>
      {list.map((item, index) => {
        const isVisibleDate = new Date(item?.createdAt).toLocaleDateString() !== new Date(list?.[index - 1]?.createdAt).toLocaleDateString();
        return (
          <Fragment key={item.id}>
            {isVisibleDate && (
              <span key={`${item.id}-date`} className="block pt-2 text-center text-sm text-gray-500">
                {new Date(item?.createdAt).toISOString().replace(/T.*$/, "")}
              </span>
            )}
            <ChatMessage key={`${item.id}-chat`} item={item} direction={item.user.id === user?.id ? "forward" : "reverse"} />
          </Fragment>
        );
      })}
    </div>
  );
};

export default ChatMessageList;
