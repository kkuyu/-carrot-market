import comment from "@api/posts/[id]/comment";
import Profiles, { ProfilesProps } from "@components/profiles";
import { getDiffTimeStr } from "@libs/utils";

export interface CommentItem extends ProfilesProps {
  id: number;
  comment: string;
  emdPosNm: string;
  updatedAt: Date;
}

interface CommentsProps {
  list: CommentItem[];
}

const Comments = ({ list }: CommentsProps) => {
  const today = new Date();

  if (!list.length) {
    return null;
  }

  return (
    <ul className="mt-5 space-y-3">
      {list.map((item) => {
        const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());
        return (
          <li key={item?.id} className="">
            {/* todo: 삭제, 수정 */}
            <Profiles user={item?.user} emdPosNm={item.emdPosNm} diffTime={diffTime} size="sm" />
            <p className="pl-14">{item.comment}</p>
          </li>
        );
      })}
    </ul>
  );
};

export default Comments;
