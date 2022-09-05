import type { HTMLAttributes } from "react";
// @libs
import { getStoryCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
// @api
import { StoryCondition } from "@api/stories/[id]";
import { GetStoriesResponse } from "@api/stories";
import { GetCommentsDetailResponse } from "@api/comments/[id]";

export type StorySummaryItem = GetStoriesResponse["stories"][number] | GetCommentsDetailResponse["comment"]["story"];

export interface StorySummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: StorySummaryItem;
  condition?: StoryCondition;
}

const StorySummary = (props: StorySummaryProps) => {
  const { item, condition, className = "", ...restProps } = props;
  const { user } = useUser();

  // variable: visible
  const storyCondition = condition ?? getStoryCondition(item!, user?.id);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <strong className="block text-sm font-normal text-ellipsis">{item?.content}</strong>
      <div className="text-description text-sm text-ellipsis">
        {storyCondition?.category && <span>{storyCondition?.category?.text}</span>}
        {item?.user?.name && <span>{item?.user?.name}</span>}
        {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
      </div>
    </div>
  );
};

export default StorySummary;
