import Link from "next/link";
// @components
import CommentSummary, { CommentSummaryItem } from "@components/cards/commentSummary";

interface CommentSummaryListProps {
  list?: CommentSummaryItem[];
}

const CommentSummaryList = ({ list = [] }: CommentSummaryListProps) => {
  if (!Boolean(list.length)) {
    return null;
  }

  return (
    <ul className="divide-y-8">
      {list?.map((item) => {
        return (
          <li key={item.id} className="relative">
            <Link href={`/stories/${item?.story?.id}`}>
              <a className="block p-5">
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
