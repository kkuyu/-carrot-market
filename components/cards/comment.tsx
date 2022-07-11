import Link from "next/link";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @components
import Profiles, { ProfilesProps } from "@components/profiles";

export type CommentItem = ProfilesProps & {
  id: number;
  comment: string;
  emdPosNm: string;
  updatedAt: Date;
};

interface CommentProps {
  item: CommentItem;
}

const Comment = ({ item }: CommentProps) => {
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime());

  return (
    <div className="relative">
      <Link href={`/users/profiles/${item?.user?.id}`}>
        <a>
          <Profiles user={item?.user} emdPosNm={item.emdPosNm} diffTime={diffTime} size="sm" />
        </a>
      </Link>
      <div className="pl-14">
        <p>{item.comment}</p>
      {/* todo: 삭제, 수정 */}
      </div>
    </div>
  );
};

export default Comment;
