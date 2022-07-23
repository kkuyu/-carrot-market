import Comment, { CommentItem, CommentProps } from "@components/cards/comment";

interface CommentListProps {
  list: CommentItem[];
}

const CommentList = ({ list }: CommentListProps) => {
  return (
    <ul className=" space-y-3">
      {list.map((item) => (
        <li key={item.id}>
          <Comment item={item} />
        </li>
      ))}
    </ul>
  );
};

export default CommentList;
