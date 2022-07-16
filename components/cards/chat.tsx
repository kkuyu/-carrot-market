import Image from "next/image";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @api
import { GetChatsResponse } from "@api/chats";
import { GetChatsByProductsResponse } from "@api/chats/products/[id]";

type ChatItem = GetChatsResponse["chats"][0] | GetChatsByProductsResponse["chats"][0];

interface ChatProps {
  item: ChatItem;
  users: ChatItem["users"];
  usersThumbnail?: string;
  productThumbnail?: string;
}

const Chat = ({ item, users, usersThumbnail = "", productThumbnail = "" }: ChatProps) => {
  if (!item) return null;

  const today = new Date();
  const createdDate = new Date(item.chatMessages[0].createdAt);

  const diffTime =
    today.toISOString().replace(/T.*$/, "") === (item.createdAt + "").replace(/T.*$/, "")
      ? createdDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      : getDiffTimeStr(createdDate.getTime(), today.getTime());

  return (
    <div className="flex w-full items-center gap-3">
      <div className="relative flex-none w-14 h-14 bg-slate-300 border border-gray-300 overflow-hidden rounded-full">
        {usersThumbnail ? (
          <>
            <span className="block pb-[100%]"></span>
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${usersThumbnail}/avatar`} alt="" layout="fill" objectFit="cover" />
          </>
        ) : (
          <svg className="mx-auto my-4 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            ></path>
          </svg>
        )}
      </div>
      <div className="grow shrink basis-auto min-w-0">
        <div className="flex items-center">
          <strong className="overflow-hidden whitespace-nowrap overflow-ellipsis">{users.map((user) => user.name).join(", ")}</strong>
          <span className="flex-none pl-1.5 text-sm text-gray-500">{diffTime}</span>
        </div>
        <span className="block overflow-hidden whitespace-nowrap overflow-ellipsis">{item.chatMessages[0].text}</span>
      </div>
      {productThumbnail && (
        <div className="relative flex-none w-10 h-10 bg-slate-300 overflow-hidden rounded-md">
          <span className="block pb-[100%]"></span>
          <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${productThumbnail}/avatar`} alt="" layout="fill" objectFit="cover" />
        </div>
      )}
    </div>
  );
};

export default Chat;
