import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { GetChatsResponse } from "@api/chats";
// @components
import Images from "@components/images";

export type ChatItem = GetChatsResponse["chats"][0];

export interface ChatProps {
  item: ChatItem;
  users: ChatItem["users"];
  content: "message" | "timestamp";
  isVisibleProduct?: boolean;
}

const Chat = ({ item, users, content, isVisibleProduct = true }: ChatProps) => {
  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const createdDate = new Date(item.chatMessages[0].createdAt);
  const diffTime = getDiffTimeStr(createdDate.getTime(), today.getTime(), { defaultValue: createdDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), diffLabel: "일" });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  return (
    <div className="flex w-full items-center text-left gap-3">
      <div className="flex-none">
        <Images cloudId={users.length === 1 ? users[0].avatar : null} cloudVariant="avatar" alt="" />
      </div>
      <div className="grow shrink basis-auto min-w-0">
        <div className="flex items-center">
          <strong className="overflow-hidden whitespace-nowrap overflow-ellipsis">{users.map((user) => user.name).join(", ")}</strong>
          {content === "message" && <span className="flex-none pl-1.5 text-sm text-gray-500">{mounted ? diffTime : null}</span>}
        </div>
        {content === "message" && <span className="block overflow-hidden whitespace-nowrap overflow-ellipsis">{item.chatMessages[0].text}</span>}
        {content === "timestamp" && <span className="block text-sm text-gray-500">{mounted ? diffTime : null}</span>}
      </div>
      {isVisibleProduct && Boolean(item.product?.photos.length) && (
        <Images size="2.5rem" cloudId={item.product?.photos.length ? item.product?.photos.split(",")[0] : null} cloudVariant="avatar" rounded="md" alt="" />
      )}
    </div>
  );
};

export default Chat;
