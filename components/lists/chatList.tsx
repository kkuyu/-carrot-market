import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Chat, { ChatItem, ChatProps } from "@components/cards/chat";

interface ChatListProps extends HTMLAttributes<HTMLUListElement> {
  type: "link" | "button";
  list: ChatItem[];
  sort: ChatProps["sort"];
  isSingleUser?: boolean;
  cardProps?: Partial<ChatProps>;
  selectItem?: (item: ChatItem, user: ChatItem["users"][0]) => void;
}

const ChatList = (props: ChatListProps) => {
  const { type = "link", list, sort, isSingleUser = false, cardProps = {}, className = "", selectItem, ...restProps } = props;
  const { user } = useUser();

  const ListItem = (itemProps: { item: ChatItem; users: ChatItem["users"]; children: JSX.Element } & HTMLAttributes<HTMLLIElement>) => {
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
                <Chat item={item} sort={sort} users={users} isVisibleProduct={type === "link" ? true : false} {...cardProps} />
              </ListItem>
            );
          }
          return users.map((user) => {
            return (
              <ListItem key={`${item.id}-${user.id}`} item={item} users={[user]}>
                <Chat item={item} sort={sort} users={users} isVisibleProduct={type === "link" ? true : false} {...cardProps} />
              </ListItem>
            );
          });
        })}
    </ul>
  );
};

export default ChatList;
