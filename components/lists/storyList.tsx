import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
// @libs
import { truncateStr } from "@libs/utils";
// @components
import Story, { StoryItem, StoryProps } from "@components/cards/story";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import { FeedbackStoryProps } from "@components/groups/feedbackStory";

interface StoryListProps {
  list: StoryItem[];
  children?: React.ReactNode;
}

const StoryList = ({ list, children = [] }: StoryListProps) => {
  if (!Boolean(list.length)) {
    return null;
  }

  return (
    <ul className="divide-y-8">
      {list.map((item) => {
        let includeFeedbackStory = false;
        const childrenWithProps = Children.map(children, (child) => {
          if (isValidElement(child)) {
            if (child.key === "FeedbackStory") includeFeedbackStory = true;
            if (child.key === "FeedbackStory") return cloneElement(child as React.ReactElement<FeedbackStoryProps>, { item });
          }
          return child;
        });
        const thumbnails: PictureListItem[] = !item?.photos
          ? []
          : item.photos.split(",").map((src, index, array) => ({
              src,
              index,
              key: `thumbnails-list-${index + 1}`,
              label: `${index + 1}/${array.length}`,
              name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(item.content, 15)})`,
            }));
        return (
          <li key={item?.id} className="relative">
            <div>
              <Link href={`/stories/${item?.id}`}>
                <a className="block pt-5 px-5 pb-3 last:pb-5">
                  <Story item={item} isVisibleInfo={includeFeedbackStory} />
                </a>
              </Link>
              {Boolean(thumbnails.length) && (
                <div className="empty:hidden px-5 pb-3 last:pb-5">
                  <PictureList list={thumbnails} />
                </div>
              )}
              {!includeFeedbackStory && (
                <div className="empty:hidden px-5 pb-3 last:pb-5 text-sm text-gray-500">
                  {[item?.records?.length ? `관심 ${item?.records?.length}` : null, item.comments?.length ? `댓글 ${item.comments.length}` : null].filter((v) => !!v).join(" · ")}
                </div>
              )}
            </div>
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default StoryList;
