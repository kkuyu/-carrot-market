import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
import { Children, cloneElement, isValidElement } from "react";
// @libs
import { truncateStr } from "@libs/utils";
// @components
import Story, { StoryItem, StoryProps } from "@components/cards/story";
import { PictureListProps } from "@components/groups/pictureList";
import { FeedbackStoryProps } from "@components/groups/feedbackStory";

interface StoryListProps extends HTMLAttributes<HTMLUListElement> {
  list: StoryItem[];
  cardProps?: Partial<StoryProps>;
  children?: ReactElement | ReactElement[];
}

const StoryList = (props: StoryListProps) => {
  const { list, children = [], cardProps = {}, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`[&:not(.divide-y-2)]:divide-y [&:not(.border-b-0):not(.border-b-2)]:border-b ${className}`} {...restProps}>
      {list.map((item) => {
        const childrenWithProps = Children.map(children, (child) => {
          if (isValidElement(child)) {
            if (child.key === "PictureList")
              return cloneElement(child as ReactElement<PictureListProps>, {
                className: "px-5 pb-3",
                list: item?.photos
                  ? item?.photos.split(";").map((src, index, array) => {
                      const key = `thumbnails-list-${index + 1}`;
                      const label = `${index + 1}/${array.length}`;
                      const name = `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(item.content, 15)})`;
                      return { src, index, key, label, name };
                    })
                  : [],
              });
            if (child.key === "FeedbackStory") return <div className="px-5">{cloneElement(child as ReactElement<FeedbackStoryProps>, { item })}</div>;
          }
          return child;
        });
        return (
          <li key={item?.id} className="relative">
            <Link href={`/stories/${item?.id}`}>
              <a className="block pt-3 pb-3 px-5">
                <Story item={item} {...cardProps} />
              </a>
            </Link>
            {childrenWithProps}
          </li>
        );
      })}
    </ul>
  );
};

export default StoryList;
