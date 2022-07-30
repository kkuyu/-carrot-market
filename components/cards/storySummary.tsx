// @libs
import { getStoryCategory } from "@libs/utils";
// @api
import { GetStoriesResponse } from "@api/stories";
import { GetCommentsDetailResponse } from "@api/comments/[id]";

export type StorySummaryItem = GetStoriesResponse["stories"][0] | GetCommentsDetailResponse["comment"]["story"];

export interface StorySummaryProps {
  item: StorySummaryItem;
}

const StorySummary = ({ item }: StorySummaryProps) => {
  if (!item) return null;

  const category = getStoryCategory(item?.category);

  return (
    <div className="relative">
      <div>
        <strong className="block text-sm font-normal overflow-hidden whitespace-nowrap overflow-ellipsis">{item?.content}</strong>
      </div>
      <div className="block">
        <span className="text-sm text-gray-500">{[category?.text, item?.user?.name, item?.emdPosNm].filter((v) => !!v).join(" · ")}</span>
      </div>
    </div>
  );
};

export default StorySummary;
