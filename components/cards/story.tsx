import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { Kind } from "@prisma/client";
// @libs
import { getCategory, getDiffTimeStr } from "@libs/utils";
// @api
import { StoryCategories, EmotionIcon } from "@api/stories/types";
import { GetStoriesResponse } from "@api/stories";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories/[filter]";
import { GetSearchResultResponse } from "@api/search/result/[filter]";
// @components
import HighlightText from "@components/highlightText";
import Icons from "@components/icons";
import Images from "@components/images";

export type StoryItem = GetStoriesResponse["stories"][number] | GetProfilesStoriesResponse["stories"][number] | GetSearchResultResponse["stories"][number];

export interface StoryProps extends HTMLAttributes<HTMLDivElement> {
  item: StoryItem;
  highlightWord?: string;
  summaryType?: "record" | "report";
  isVisiblePreviewPhoto?: boolean;
  isVisiblePreviewComment?: boolean;
}

const Story = (props: StoryProps) => {
  const { item, highlightWord = "", summaryType = "record", isVisiblePreviewPhoto = false, isVisiblePreviewComment = false, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
  const category = getCategory<StoryCategories>(item?.category);
  const likeRecords = item?.records?.filter((record) => record.kind === Kind.StoryLike) || [];
  const previewComments = item?.comments?.filter((comment) => comment.content) || [];

  const SummaryRecord = (summaryProps: { item: StoryProps["item"] } & HTMLAttributes<HTMLDivElement>) => {
    const { item, className: summaryClassName = "", ...restSummaryProps } = summaryProps;
    return (
      <div className={`flex flex-wrap justify-between ${summaryClassName}`} {...restSummaryProps}>
        <div className="text-description text-sm">
          {item?.user?.name && <span>{item?.user?.name}</span>}
          {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
        </div>
        <div className="text-description text-sm">{mounted && diffTime && <span>{diffTime}</span>}</div>
      </div>
    );
  };

  const SummaryReport = (summaryProps: { item: StoryProps["item"] } & HTMLAttributes<HTMLDivElement>) => {
    const { item, className: summaryClassName = "", ...restSummaryProps } = summaryProps;
    return (
      <div className={`flex flex-wrap justify-between ${summaryClassName}`} {...restSummaryProps}>
        <div className="text-description text-sm">
          {item?.user?.name && <span>{item?.user?.name}</span>}
          {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
          {mounted && diffTime && <span>{diffTime}</span>}
        </div>
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
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div className="flex">
        <div className="grow-full">
          <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
          <strong className="mt-2 block font-normal">{highlightWord ? <HighlightText originalText={item?.content || ""} highlightWord={highlightWord} /> : item?.content}</strong>
        </div>
        {isVisiblePreviewPhoto && item?.photos && <Images cloudId={item.photos.replace(/;.*/, "")} alt="" className="flex-none rounded-md" />}
      </div>

      {summaryType === "record" && <SummaryRecord item={item} className="mt-2" />}
      {summaryType === "report" && <SummaryReport item={item} className="mt-2" />}

      {isVisiblePreviewComment && Boolean(previewComments?.length) && (
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
