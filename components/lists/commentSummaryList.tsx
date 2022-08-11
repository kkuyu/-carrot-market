import Link from "next/link";
// @components
import CommentSummary, { CommentSummaryItem } from "@components/cards/commentSummary";

interface CommentSummaryListProps extends React.HTMLAttributes<HTMLUListElement> {
  list?: CommentSummaryItem[];
}

const CommentSummaryList = (props: CommentSummaryListProps) => {
  const { list = [], className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`divide-y-8 ${className}`} {...restProps}>
      {list?.map((item) => {
        return (
          <li key={item.id} className="relative">
            <Link href={`/stories/${item?.story?.id}`}>
              <a className="block px-5 py-3">
                <CommentSummary item={item} />
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default CommentSummaryList;
