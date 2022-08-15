import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Chat, { ChatItem, ChatProps } from "@components/cards/chat";

interface ChatListProps extends HTMLAttributes<HTMLUListElement> {
  type: "link" | "button";
  list: ChatItem[];
  content: ChatProps["content"];
  isSingleUser?: boolean;
  selectItem?: (item: ChatItem, user: ChatItem["users"][0]) => void;
}

const ChatList = (props: ChatListProps) => {
  const { type = "link", list, content, isSingleUser = false, className = "", selectItem, ...restProps } = props;
  const { user } = useUser();

  const ListItem = (itemProps: HTMLAttributes<HTMLLIElement> & { item: ChatItem; users: ChatItem["users"]; children: JSX.Element }) => {
    const { item, users, className: itemClassName = "", children } = itemProps;
    return (
      <li className={`${itemClassName}`}>
        {type === "link" && (
          <Link href={`/chats/${item.id}`}>
            <a className="block px-5 py-3">{children}</a>
          </Link>
        )}
        {type === "button" && selectItem && (
          <button type="button" className="block-arrow py-3" onClick={() => selectItem(item, users[0])}>
            {children}
          </button>
        )}
        {type === "button" && !selectItem && <div className="block-arrow py-3">{children}</div>}
      </li>
    );
  };

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`divide-y ${className}`} {...restProps}>
      {list
        .filter((item) => item.chatMessages.length)
        .map((item) => {
          const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
          if (!isSingleUser) {
            return (
              <ListItem key={item.id} item={item} users={users}>
                <Chat item={item} users={users} content={content} isVisibleProduct={type === "link" ? true : false} />
              </ListItem>
            );
          }
          return users.map((user) => {
            return (
              <ListItem key={`${item.id}-${user.id}`} item={item} users={[user]}>
                <Chat item={item} users={users} content={content} isVisibleProduct={type === "link" ? true : false} />
              </ListItem>
            );
          });
        })}
    </ul>
  );
};

export default ChatList;
