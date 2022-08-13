import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
// @libs
import { truncateStr } from "@libs/utils";
// @components
import Story, { StoryItem, StoryProps } from "@components/cards/story";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import { FeedbackStoryProps } from "@components/groups/feedbackStory";

interface StoryListProps extends React.HTMLAttributes<HTMLUListElement> {
  list: StoryItem[];
  highlight?: string[];
  children?: React.ReactNode;
}

const StoryList = (props: StoryListProps) => {
  const { list, children = [], highlight = [], className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`divide-y-4 ${className}`} {...restProps}>
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
            <Link href={`/stories/${item?.id}`}>
              <a className="block pt-3 pb-3 px-5">
                <Story item={item} isVisibleFeedback={includeFeedbackStory} highlight={highlight} />
              </a>
            </Link>
            {Boolean(thumbnails.length) && (
              <div className="empty:hidden px-5 pb-3">
                <PictureList list={thumbnails} />
              </div>
            )}
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default StoryList;
