import type { HTMLAttributes } from "react";
// @libs
import { getStoryCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { GetStoriesResponse } from "@api/stories";
import { StoryCondition } from "@api/stories/[id]";
import { GetProfilesDetailStoriesResponse } from "@api/profiles/[id]/stories/[filter]";
import { GetSearchResultResponse } from "@api/search/result/[filter]";
// @components
import HighlightText from "@components/highlightText";
import Icons from "@components/icons";
import Images from "@components/images";

export type StoryItem = GetStoriesResponse["stories"][number] | GetProfilesDetailStoriesResponse["stories"][number] | GetSearchResultResponse["stories"][number];

export interface StoryProps extends HTMLAttributes<HTMLDivElement> {
  item: StoryItem;
  condition?: StoryCondition;
  highlightWord?: string;
  summaryType?: "record" | "report";
  isVisiblePreviewPhoto?: boolean;
  isVisiblePreviewComment?: boolean;
}

const Story = (props: StoryProps) => {
  const { item, condition, highlightWord, summaryType = "record", isVisiblePreviewPhoto = false, isVisiblePreviewComment = false, className = "", ...restProps } = props;
  const { user } = useUser();

  // variable: visible
  const { isMounted, timeState } = useTimeDiff(item?.createdAt.toString() || null);
  const storyCondition = condition ?? getStoryCondition(item, user?.id);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div className={`${isVisiblePreviewPhoto && item?.photos ? "relative pr-16" : ""}`}>
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{storyCondition?.category?.text}</em>
        <strong className="mt-2 block font-normal">
          {highlightWord ? <HighlightText originalText={item?.content || ""} highlightWord={highlightWord} className="font-semibold" /> : item?.content}
        </strong>
        {isVisiblePreviewPhoto && item?.photos && (
          <div className="absolute top-0 right-0">
            <Images cloudId={item.photos.replace(/;.*/, "")} alt="" className="rounded-md" />
          </div>
        )}
      </div>
      {/* record */}
      {summaryType === "record" && (
        <div className="mt-2 flex flex-wrap justify-between">
          <div className="text-description text-sm">
            {item?.user?.name && <span>{item?.user?.name}</span>}
            {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
          </div>
          <div className="text-description text-sm">{isMounted && timeState.diffStr && <span>{timeState.diffStr}</span>}</div>
        </div>
      )}
      {/* report */}
      {summaryType === "report" && (
        <div className="mt-2 flex flex-wrap justify-between">
          <div className="text-description text-sm">
            {item?.user?.name && <span>{item?.user?.name}</span>}
            {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
            {isMounted && timeState.diffStr && <span>{timeState.diffStr}</span>}
          </div>
          <div className="flex">
            {/* 궁금해요 */}
            {!storyCondition?.category?.isLikeWithEmotion && Boolean(storyCondition?.likes) && (
              <span className="inline-flex items-center">
                <Icons name="QuestionMarkCircle" className="w-5 h-5 text-gray-500" />
                <span className="ml-1 text-sm text-gray-500">{storyCondition?.likes}</span>
              </span>
            )}
            {/* 공감하기 */}
            {storyCondition?.category?.isLikeWithEmotion && Boolean(storyCondition?.likes) && (
              <span className="inline-flex items-center">
                <span className="w-5 h-5 text-sm">{storyCondition?.emoji}</span>
                <span className="ml-1 text-sm text-gray-500">{storyCondition?.likes}</span>
              </span>
            )}
            {/* 댓글/답변 */}
            {Boolean(storyCondition?.comments) && (
              <span className="inline-flex items-center last:ml-2">
                <Icons name="ChatBubbleOvalLeftEllipsis" className="w-5 h-5 text-gray-500" />
                <span className="ml-1 text-sm text-gray-500">{storyCondition?.comments}</span>
              </span>
            )}
          </div>
        </div>
      )}
      {isVisiblePreviewComment && Boolean(item?.comments?.filter((comment) => comment.content)?.length) && (
        <div className="mt-2">
          <strong className="sr-only">댓글</strong>
          <ul className="space-y-2">
            {item?.comments
              ?.filter((comment) => comment.content)
              ?.map((comment) => (
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
