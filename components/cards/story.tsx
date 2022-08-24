import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { Kind } from "@prisma/client";
// @libs
import { getStoryCategory, getDiffTimeStr } from "@libs/utils";
// @api
import { EmotionIcon } from "@api/stories/types";
import { GetStoriesResponse } from "@api/stories";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories/[filter]";
import { GetSearchResultResponse } from "@api/search/result/[filter]";
// @components
import HighlightText from "@components/highlightText";
import Icons from "@components/icons";

export type StoryItem = GetStoriesResponse["stories"][number] | GetProfilesStoriesResponse["stories"][number] | GetSearchResultResponse["stories"][number];

export interface StoryProps extends HTMLAttributes<HTMLDivElement> {
  item: StoryItem;
  highlightWord?: string;
  summaryType?: "record" | "report";
}

const Story = (props: StoryProps) => {
  const { item, highlightWord = "", summaryType = "record", className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
  const category = getStoryCategory(item?.category);
  const likeRecords = item?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const previewComments = item?.comments?.filter((comment) => comment.content) || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div>
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
        <strong className="mt-2 block font-normal">{highlightWord ? <HighlightText originalText={item?.content || ""} highlightWord={highlightWord} /> : item?.content}</strong>
      </div>
      {summaryType === "record" && (
        <div className="mt-2 flex flex-wrap justify-between">
          <span className="text-sm text-gray-500">{[item?.user?.name, item?.emdPosNm].filter((v) => !!v).join(" · ")}</span>
          <span className="text-sm text-gray-500">{[mounted ? diffTime : null].filter((v) => !!v).join(" · ")}</span>
        </div>
      )}
      {summaryType === "report" && (
        <div className="mt-2 flex flex-wrap justify-between">
          <span className="text-sm text-gray-500">{[item?.user?.name, item?.emdPosNm, mounted ? diffTime : null].filter((v) => !!v).join(" · ")}</span>
          <div className="flex">
            {/* 궁금해요 */}
            {!category?.isLikeWithEmotion && Boolean(likeRecords?.length) && (
              <span className="inline-flex items-center">
                <Icons name="QuestionMarkCircle" className="w-5 h-5 text-gray-500" />
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
                <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
                <span className="ml-1 text-sm text-gray-500">{item.comments?.length}</span>
              </span>
            )}
          </div>
        </div>
      )}
      {Boolean(previewComments?.length) && (
        <div className="mt-2">
          <strong className="sr-only">댓글</strong>
          <ul className="space-y-2">
            {previewComments?.map((comment) => (
              <li key={comment.id} className="relative block py-1.5 pl-6 pr-2 border border-gray-300 rounded-lg">
                <span className="absolute top-2.5 left-2.5 w-2 h-2 border-l border-b border-gray-300" />
                <span>{highlightWord ? <HighlightText originalText={comment?.content || ""} highlightWord={highlightWord} /> : comment?.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Story;
