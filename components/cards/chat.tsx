import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { GetChatsResponse } from "@api/chats";
// @components
import Images from "@components/images";

export type ChatItem = GetChatsResponse["chats"][number];

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  item: ChatItem;
  users: ChatItem["users"];
  sort: "message" | "timestamp";
  isVisibleProduct?: boolean;
}

const Chat = (props: ChatProps) => {
  const { item, users, sort, isVisibleProduct = true, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const createdDate = new Date(item.chatMessages[0].createdAt);
  const diffTime = getDiffTimeStr(createdDate.getTime(), today.getTime(), { defaultValue: createdDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), diffLabel: "일" });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  return (
    <div className={`flex w-full items-center text-left gap-3 ${className}`} {...restProps}>
      <div className="flex-none">
        <Images cloudId={users.length === 1 ? users[0].avatar : null} cloudVariant="avatar" alt="" className="rounded-full" />
      </div>
      <div className="grow-full">
        <div className="flex items-center">
          <strong className="text-ellipsis">{users.map((user) => user.name).join(", ")}</strong>
          {sort === "message" && mounted && diffTime && <span className="flex-none pl-1.5 text-sm text-gray-500">{diffTime}</span>}
        </div>
        {sort === "message" && <span className="block text-ellipsis">{item.chatMessages[0].text}</span>}
        {sort === "timestamp" && mounted && diffTime && <span className="block text-sm text-gray-500 text-ellipsis">{diffTime}</span>}
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
