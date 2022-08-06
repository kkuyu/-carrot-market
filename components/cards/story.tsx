import { useEffect, useState } from "react";
// @libs
import { getStoryCategory, getDiffTimeStr } from "@libs/utils";
// @api
import { GetStoriesResponse } from "@api/stories";
import { GetProfilesStoriesResponse } from "@api/profiles/[id]/stories";

export type StoryItem = GetStoriesResponse["stories"][0] | GetProfilesStoriesResponse["stories"][0];

export interface StoryProps {
  item: StoryItem;
  isVisibleInfo?: boolean;
}

const Story = ({ item, isVisibleInfo = true }: StoryProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
  const category = getStoryCategory(item?.category);

  return (
    <div className="relative">
      <div>
        <em className="px-2 py-1 text-sm not-italic bg-gray-200 rounded-sm">{category?.text}</em>
        <strong className="mt-2 block font-normal">{item?.content}</strong>
      </div>
      {isVisibleInfo && (
        <div className="mt-2 flex justify-between">
          <span className="text-sm text-gray-500">{[item?.user?.name, item?.emdPosNm].filter((v) => !!v).join(" · ")}</span>
          <span className="text-sm text-gray-500">{mounted ? diffTime : null}</span>
        </div>
      )}
    </div>
  );
};

export default Story;
