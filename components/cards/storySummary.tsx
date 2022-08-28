import type { HTMLAttributes } from "react";
// @libs
import { getCategory } from "@libs/utils";
// @api
import { StoryCategories } from "@api/stories/types";
import { GetStoriesResponse } from "@api/stories";
import { GetCommentsDetailResponse } from "@api/comments/[id]";

export type StorySummaryItem = GetStoriesResponse["stories"][number] | GetCommentsDetailResponse["comment"]["story"];

export interface StorySummaryProps extends HTMLAttributes<HTMLDivElement> {
  item: StorySummaryItem;
}

const StorySummary = (props: StorySummaryProps) => {
  const { item, className = "", ...restProps } = props;

  const category = item && getCategory<StoryCategories>(item?.category);

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <strong className="block text-sm font-normal text-ellipsis">{item?.content}</strong>
      <div className="text-description text-sm text-ellipsis">
        {category?.text && <span>{category?.text}</span>}
        {item?.user?.name && <span>{item?.user?.name}</span>}
        {item?.emdPosNm && <span>{item?.emdPosNm}</span>}
      </div>
    </div>
  );
};

export default StorySummary;
