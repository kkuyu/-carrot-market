import Link from "next/link";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Chat, { ChatItem, ChatProps } from "@components/cards/chat";

interface ChatListProps {
  type: "link" | "button";
  list: ChatItem[];
  content: ChatProps["content"];
  isVisibleOnlyOneUser?: boolean;
  selectItem?: (item: ChatItem, user: ChatItem["users"][0]) => void;
}

const ChatList = ({ list, content, type = "link", isVisibleOnlyOneUser = false, selectItem }: ChatListProps) => {
  const { user } = useUser();

  const makeListItem = (item: ChatItem, users: ChatItem["users"]) => {
    switch (type) {
      case "link":
        return (
          <Link href={`/chats/${item.id}`}>
            <a className="block px-5 py-3">
              <Chat item={item} users={users} content={content} isVisibleProduct={true} />
            </a>
          </Link>
        );
      case "button":
        return (
          <button type="button" className="block-arrow py-3" onClick={() => (selectItem ? selectItem(item, users[0]) : console.log("selectItem", item, user))}>
            <Chat item={item} users={users} content={content} isVisibleProduct={false} />
          </button>
        );
      default:
        console.error("makeListItem", item, users);
        break;
    }
  };

  if (!Boolean(list.length)) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list
        .filter((item) => item.chatMessages.length)
        .map((item) => {
          const users = item.users.filter((chatUser) => chatUser.id !== user?.id);
          if (!isVisibleOnlyOneUser) {
            return <li key={item.id}>{makeListItem(item, users)}</li>;
          }
          return users.map((user) => {
            return <li key={`${item.id}-${user.id}`}>{makeListItem(item, [user])}</li>;
          });
        })}
    </ul>
  );
};

export default ChatList;
