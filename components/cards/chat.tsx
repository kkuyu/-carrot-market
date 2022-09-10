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

  // variable: visible
  const defaultTimeStr = new Date(item?.chatMessages?.[0]?.createdAt)?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const { isMounted, timeState } = useTimeDiff(item?.chatMessages?.[0]?.createdAt?.toString() || null, { config: { minimumTimeLabel: "일", defaultValue: defaultTimeStr } });

  if (!item) return null;

  return (
    <div className={`flex w-full items-center text-left gap-3 ${className}`} {...restProps}>
      <div className="relative flex-none flex flex-wrap justify-center max-w-[3.5rem] [&>div:nth-child(even)]:-ml-2 [&>div:nth-child(n+3)]:-mt-2">
        {users.map((user, index, array) => {
          if (index > 3) return null;
          return (
            <Images
              key={user.id}
              size={array.length === 1 ? "3.5rem" : "2rem"}
              {...(index === 3 && array.length > 4 ? { text: `+${array.length - 4}` } : { cloudId: user?.avatar, text: user?.name?.slice(0, 2) })}
              alt=""
              className={`rounded-full ${array.length === 1 ? "" : "outline outline-1 outline-white"}`}
            />
          );
        })}
      </div>
      <div className="grow-full">
        <div className="flex items-center">
          <strong className="text-ellipsis">{users.map((user) => user.name).join(", ")}</strong>
          <span className="flex-none pl-1.5 text-sm text-gray-500">{isMounted && timeState.diffStr ? timeState.diffStr : ""}</span>
        </div>
        {isVisibleLastChatMessage && <span className="block text-ellipsis">{item.chatMessages[0].text}</span>}
      </div>
      {isVisibleProduct && Boolean(item?.product?.photos?.length) && (
        <div className="flex-none">
          <Images size="2.5rem" cloudId={item?.product?.photos?.replace(/;.*/, "")} alt="" className="rounded-md" />
        </div>
      )}
    </div>
  );
};

export default Chat;
