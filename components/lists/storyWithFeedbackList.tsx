import Link from "next/link";
import { Children, cloneElement, isValidElement } from "react";
// @components
import Story, { StoryItem, StoryProps } from "@components/cards/story";
import PictureList, { PictureListItem } from "@components/groups/pictureList";
import { FeedbackStoryProps } from "@components/groups/feedbackStory";

interface StoryWithFeedbackListProps {
  list: StoryItem[];
  children: React.ReactNode;
}

const StoryWithFeedbackList = ({ list, children }: StoryWithFeedbackListProps) => {
  return (
    <ul className="divide-y-8">
      {list.map((item) => {
        const childrenWithProps = Children.map(children, (child, index) => {
          if (isValidElement(child)) {
            return cloneElement(child as React.ReactElement<FeedbackStoryProps>, { item });
          }
          return child;
        });
        const shortContent = !item?.content ? "" : item.content.length <= 15 ? item.content : item.content.substring(0, 15) + "...";
        const thumbnails: PictureListItem[] = !item?.photos
          ? []
          : item.photos.split(",").map((src, index, array) => ({
              src,
              index,
              key: `thumbnails-list-${index + 1}`,
              label: `${index + 1}/${array.length}`,
              name: `게시글 이미지 ${index + 1}/${array.length} (${shortContent})`,
            }));
        return (
          <li key={item?.id}>
            <Link href={`/stories/${item?.id}`}>
              <a className="block pt-5 pb-4 px-5">
                <Story item={item} />
              </a>
            </Link>
            {Boolean(thumbnails.length) && (
              <div className="pb-5 px-5">
                <PictureList list={thumbnails || []} />
              </div>
            )}
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default StoryWithFeedbackList;
