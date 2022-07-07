import { useRouter } from "next/router";
import Link from "next/link";

import { useState } from "react";
import { getCategory, getDiffTimeStr } from "@libs/utils";
import { GetPostsResponse } from "@api/posts";
import { FeelingIcon, FeelingKeys } from "@api/posts/types";

import { ThumbnailList, ThumbnailItem } from "@components/lists";

export type PostItem = GetPostsResponse["posts"][0];

interface PostsProps {
  list: GetPostsResponse["posts"];
  pathname: string;
  curiosityItem: (item: PostItem) => void;
  emotionItem: (item: PostItem, feeling: FeelingKeys) => void;
}

const Posts = ({ list, pathname, curiosityItem, emotionItem }: PostsProps) => {
  const router = useRouter();

  const today = new Date();
  const [emotionId, setEmotionId] = useState(-1);

  const getFeedbackUtils = (name: string, item: PostItem) => {
    switch (name) {
      case "curiosity":
        return (
          <button
            type="button"
            onClick={() => {
              curiosityItem(item);
            }}
            className="py-2"
          >
            <svg className={`inline-block w-5 h-5 ${item?.curiosity ? "text-orange-500" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className={`ml-1 text-sm ${item?.curiosity ? "text-orange-500" : "text-gray-500"}`}>궁금해요 {item?.curiosities?.count || null}</span>
          </button>
        );
      case "emotion":
        return (
          <button
            type="button"
            onClick={() => {
              setEmotionId((prev) => (prev === item.id ? -1 : item.id));
            }}
            onBlur={(e) => {
              const boxEl = e.relatedTarget?.closest(".emotionBox");
              if (boxEl?.isSameNode(e.relatedTarget)) return;
              if (boxEl?.contains(e.relatedTarget)) return;
              setEmotionId(-1);
            }}
            className="py-2"
          >
            {!item.emotion ? (
              <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <span className="inline-block w-5 h-5">{FeelingIcon[item.emotion]}</span>
            )}
            {!item.emotion ? <span className="ml-1 text-sm text-gray-500">공감하기</span> : <span className="ml-1 text-sm text-orange-500">공감했어요</span>}
          </button>
        );
      case "emotionBox":
        return (
          <div
            onBlur={(e) => {
              const boxEl = e.target.closest(".emotionBox");
              const prevEl = boxEl?.previousElementSibling as HTMLElement;
              if (boxEl?.isSameNode(e.relatedTarget)) return;
              if (boxEl?.contains(e.relatedTarget)) return;
              prevEl?.focus();
              setEmotionId(-1);
            }}
            className={`absolute bottom-12 left-5 px-2 bg-white border border-gray-300 rounded-lg scale-0 origin-bottom-left transition-all ${
              emotionId === item.id ? "visible scale-100" : "invisible"
            } emotionBox`}
            tabIndex={0}
            aria-hidden={emotionId !== item.id}
          >
            {(["Like", "Love", "Haha", "Wow", "Sad", "Angry"] as FeelingKeys[]).map((feeling) => {
              return (
                <button
                  type="button"
                  key={feeling}
                  onClick={() => {
                    emotionItem(item, feeling);
                    setEmotionId(-1);
                  }}
                  className="p-1"
                >
                  {FeelingIcon[feeling]}
                </button>
              );
            })}
          </div>
        );
      case "emotionCount":
        return (
          <div className="absolute bottom-0 right-0 flex items-center h-10 pr-5">
            <span className="text-xs">{item?.emotions?.feelings.map((feeling) => FeelingIcon[feeling])}</span>
            <span className="ml-1 block text-sm text-gray-500">{item?.emotions?.count || null}</span>
          </div>
        );
      case "comment":
        return (
          <button type="button" className="ml-4 py-2" onClick={() => router.push({ pathname, query: { id: item?.id } })}>
            <svg className="inline-block w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <span className="ml-1 text-sm text-gray-500">댓글 {item?._count?.comments || null}</span>
          </button>
        );
      default:
        console.error("getFeedbackUtils", name);
        return null;
    }
  };

  if (!list.length) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list.map((item) => {
        const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());
        const category = getCategory("post", item?.category);
        const cutDownContent = !item?.content ? "" : item.content.length <= 15 ? item.content : item.content.substring(0, 15) + "...";
        const thumbnails: ThumbnailItem[] = !item?.photo
          ? []
          : item.photo.split(",").map((src, index, array) => ({
              src,
              index,
              key: `thumbnails-list-${index + 1}`,
              label: `${index + 1}/${array.length}`,
              name: `게시글 이미지 ${index + 1}/${array.length} (${cutDownContent})`,
            }));

        return (
          <li key={item?.id} className="relative">
            {/* 게시글 내용 */}
            <Link href={{ pathname, query: { id: item?.id } }}>
              <a className="block pt-5 pb-4 px-5">
                <div>
                  <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
                  <strong className="mt-2 block font-normal">{item?.content}</strong>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-sm text-gray-500">
                    {item?.user?.name} · {item?.emdPosNm}
                  </span>
                  <span className="text-sm text-gray-500">{diffTime}</span>
                </div>
              </a>
            </Link>
            {/* 게시글 썸네일 */}
            {Boolean(thumbnails.length) && (
              <div className="mb-5 px-5">
                <ThumbnailList
                  list={thumbnails || []}
                  modal={{
                    title: `게시글 이미지 (${cutDownContent})`,
                  }}
                />
              </div>
            )}
            {/* 피드백 */}
            <div className="px-5 border-t">
              {category?.feedback.includes("curiosity") && getFeedbackUtils("curiosity", item)}
              {category?.feedback.includes("emotion") && getFeedbackUtils("emotion", item)}
              {category?.feedback.includes("emotion") && getFeedbackUtils("emotionBox", item)}
              {getFeedbackUtils("comment", item)}
              {category?.feedback.includes("emotion") && getFeedbackUtils("emotionCount", item)}
            </div>
          </li>
        );
      })}
      <div className="fixed top-0 left-0 text-3xl">{emotionId}</div>
    </ul>
  );
};

export default Posts;
