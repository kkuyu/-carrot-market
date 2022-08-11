// @libs
import { getStoryCategory } from "@libs/utils";
// @api
import { GetStoriesResponse } from "@api/stories";
import { GetCommentsDetailResponse } from "@api/comments/[id]";

export type StorySummaryItem = GetStoriesResponse["stories"][0] | GetCommentsDetailResponse["comment"]["story"];

export interface StorySummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  item: StorySummaryItem;
}

const StorySummary = (props: StorySummaryProps) => {
  const { item, className = "", ...restProps } = props;

  const category = getStoryCategory(item?.category || "");

  if (!item) return null;

  return (
    <div className={`relative ${className}`} {...restProps}>
      <strong className="block text-sm font-normal overflow-hidden whitespace-nowrap overflow-ellipsis">{item?.content}</strong>
      <span className="block text-sm text-gray-500 overflow-hidden whitespace-nowrap overflow-ellipsis">{[category?.text, item?.user?.name, item?.emdPosNm].filter((v) => !!v).join(" · ")}</span>
    </div>
  );
};

export default StorySummary;
