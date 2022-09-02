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
  isVisibleSingleUser?: boolean;
  cardProps?: Partial<ChatProps>;
  selectItem?: (item: ChatItem, user: ChatItem["users"][number]) => void;
}

const ChatList = (props: ChatListProps) => {
  const { type = "link", list, sort, isVisibleSingleUser = false, cardProps = {}, className = "", selectItem, ...restProps } = props;
  const { user } = useUser();

  if (!Boolean(list.length)) return null;

  const CustomListItem = (itemProps: { item: ChatItem; users: ChatItem["users"] } & HTMLAttributes<HTMLLIElement>) => {
    const { item, users, className: itemClassName = "", children, ...itemRestProps } = itemProps;
    if (type === "button" && !selectItem) console.error("ListItem", item);
    return (
      <li className={`${itemClassName}`} {...itemRestProps}>
        {type === "link" ? (
          <Link href={`/chats/${item.id}`}>
            <a className="block px-5 py-3">{children}</a>
          </Link>
        ) : selectItem ? (
          <button type="button" className="block-arrow py-3" onClick={() => selectItem(item, users[0])}>
            {children}
          </button>
        ) : (
          <div className="block-arrow py-3">{children}</div>
        )}
      </li>
    );
  };

  return (
    <ul className={`divide-y ${className}`} {...restProps}>
      {list
        .filter((item) => item.chatMessages.length)
        .map((item) => {
          const validUsers = item.users.filter((chatUser) => chatUser.id !== user?.id);
          if (!isVisibleSingleUser) {
            return (
              <CustomListItem key={item.id} item={item} users={validUsers}>
                <Chat item={item} sort={sort} users={validUsers} {...cardProps} />
              </CustomListItem>
            );
          }
          return validUsers.map((validUser) => {
            return (
              <CustomListItem key={`${item.id}-${validUser.id}`} item={item} users={[validUser]}>
                <Chat item={item} sort={sort} users={validUsers} {...cardProps} />
              </CustomListItem>
            );
          });
        })}
    </ul>
  );
};

export default ChatList;
