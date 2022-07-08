import { getDiffTimeStr } from "@libs/utils";

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
      {/* todo: 삭제, 수정 */}
      <Profiles user={item?.user} emdPosNm={item.emdPosNm} diffTime={diffTime} size="sm" />
      <p className="pl-14">{item.comment}</p>
    </div>
  );
};

export default Comment;
