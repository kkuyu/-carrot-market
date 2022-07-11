// @libs
import { getCategory, getDiffTimeStr } from "@libs/utils";
// @api
import { GetStoriesResponse } from "@api/stories";

export type StoryItem = GetStoriesResponse["stories"][0];

interface StoryProps {
  item: StoryItem;
}

const Story = ({ item }: StoryProps) => {
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());
  const category = getCategory("story", item?.category);

  return (
    <div className="relative">
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
    </div>
  );
};

export default Story;
