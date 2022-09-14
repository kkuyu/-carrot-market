import Link from "next/link";
import type { HTMLAttributes } from "react";
// @components
import CommentSummary, { CommentSummaryItem, CommentSummaryProps } from "@components/cards/commentSummary";

interface CommentSummaryListProps extends HTMLAttributes<HTMLUListElement> {
  list?: CommentSummaryItem[];
  cardProps?: Partial<CommentSummaryProps>;
}

const CommentSummaryList = (props: CommentSummaryListProps) => {
  const { list = [], cardProps = {}, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`[&:not(.divide-y-2)]:divide-y ${className}`} {...restProps}>
      {list?.map((item) => {
        return (
          <li key={item.id} className="relative">
            <Link href={`/stories/${item?.story?.id}`}>
              <a className="block px-5 py-3.5">
                <CommentSummary item={item} {...cardProps} />
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default CommentSummaryList;
