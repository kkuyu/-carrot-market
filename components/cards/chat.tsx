import type { HTMLAttributes } from "react";
// @libs
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { GetChatsResponse } from "@api/chats";
// @components
import Images from "@components/images";

export type ChatItem = GetChatsResponse["chats"][number];

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  item: ChatItem;
  users: ChatItem["users"];
  isVisibleProduct?: boolean;
  isVisibleLastChatMessage?: boolean;
}

const Chat = (props: ChatProps) => {
  const { item, users, isVisibleProduct = true, isVisibleLastChatMessage = true, className = "", ...restProps } = props;

  const { isMounted, timeState } = useTimeDiff(item?.chatMessages?.[0]?.createdAt?.toString() || null, {
    config: { diffLabel: "일", defaultValue: new Date(item?.chatMessages?.[0]?.createdAt)?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) },
  });

  if (!item) return null;

  return (
    <div className={`flex w-full items-center text-left gap-3 ${className}`} {...restProps}>
      <div className="flex-none">
        <Images cloudId={users.length === 1 ? users[0].avatar : null} cloudVariant="avatar" alt="" className="rounded-full" />
      </div>
      <div className="grow-full">
        <div className="flex items-center">
          <strong className="text-ellipsis">{users.map((user) => user.name).join(", ")}</strong>
          <span className="flex-none pl-1.5 text-sm text-gray-500">{isMounted && timeState.diffStr ? timeState.diffStr : ""}</span>
        </div>
        {isVisibleLastChatMessage && <span className="block text-ellipsis">{item.chatMessages[0].text}</span>}
      </div>
      {isVisibleProduct && Boolean(item.product?.photos.length) && (
        <div className="flex-none">
          <Images size="2.5rem" cloudId={item.product?.photos.length ? item.product?.photos.split(";")[0] : null} cloudVariant="avatar" alt="" className="rounded-md" />
        </div>
      )}
    </div>
  );
};

export default Chat;
