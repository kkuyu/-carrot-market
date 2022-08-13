import { useEffect, useState } from "react";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCategory, getDiffTimeStr } from "@libs/utils";
// @api
import { EmotionIcon } from "@api/stories/types";
import { GetStoriesResponse } from "@api/stories";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories";
// @components
import Highlights from "@components/highlights";

export type StoryItem = GetStoriesResponse["stories"][0] | GetProfilesStoriesResponse["stories"][0];

export interface StoryProps extends React.HTMLAttributes<HTMLDivElement> {
  item: StoryItem;
  highlight?: string[];
  isVisibleFeedback?: boolean;
}

const Story = (props: StoryProps) => {
  const { item, isVisibleFeedback = true, highlight = [], className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
  const category = getStoryCategory(item?.category);
  const comments = item?.comments?.filter((comment) => comment?.userId && comment?.content && Boolean(comment?.content?.length));
  const likeRecords = item?.records?.filter((record) => record.kind === Kind.StoryLike) || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div>
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
        <strong className="mt-2 block font-normal">{highlight ? <Highlights text={item?.content || ""} highlight={highlight} /> : item?.content}</strong>
      </div>
      {isVisibleFeedback ? (
        <div className="mt-2 flex flex-wrap justify-between">
          <span className="text-sm text-gray-500">{[item?.user?.name, item?.emdPosNm].filter((v) => !!v).join(" · ")}</span>
          <span className="text-sm text-gray-500">{[mounted ? diffTime : null].filter((v) => !!v).join(" · ")}</span>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap justify-between">
          <span className="text-sm text-gray-500">{[item?.user?.name, item?.emdPosNm, mounted ? diffTime : null].filter((v) => !!v).join(" · ")}</span>
          <div className="flex">
            {/* 궁금해요 */}
            {!category?.isLikeWithEmotion && Boolean(likeRecords?.length) && (
              <span className="inline-flex items-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1 text-sm text-gray-500">{likeRecords?.length}</span>
              </span>
            )}
            {/* 공감하기 */}
            {category?.isLikeWithEmotion && Boolean(likeRecords?.length) && (
              <span className="inline-flex items-center">
                {Object.entries(EmotionIcon)
                  .sort(([, a], [, b]) => a.index - b.index)
                  .filter(([key]) => likeRecords.find((i) => i.emotion === key))
                  .map(([key, emotion]) => (
                    <span key={key} className="w-5 h-5 text-sm">
                      {emotion.text}
                    </span>
                  ))}
                <span className="ml-1 text-sm text-gray-500">{likeRecords.length}</span>
              </span>
            )}
            {/* 댓글/답변 */}
            {Boolean(item.comments?.length) && (
              <span className="inline-flex items-center last:ml-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="ml-1 text-sm text-gray-500">{item.comments?.length}</span>
              </span>
            )}
          </div>
        </div>
      )}
      {Boolean(comments?.length) && (
        <div className="mt-2">
          <strong className="sr-only">댓글</strong>
          <ul className="space-y-2">
            {comments?.map((comment) => (
              <li key={comment.id} className="relative block py-1.5 pl-6 pr-2 border border-gray-300 rounded-lg">
                <span className="absolute top-2.5 left-2.5 w-2 h-2 border-l border-b border-gray-300" />
                <span>{highlight ? <Highlights text={comment?.content || ""} highlight={highlight} /> : comment?.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Story;
