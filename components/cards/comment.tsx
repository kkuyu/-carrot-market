import Link from "next/link";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
// @components
import Profiles, { ProfilesProps } from "@components/profiles";

export type CommentItem = ProfilesProps & {
  id: number;
  comment: string;
  emdPosNm: string;
  updatedAt: Date;
  createdAt: Date;
};

interface CommentProps {
  item: CommentItem;
}

const Comment = ({ item }: CommentProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!item) return null;

  const today = new Date();
  const isEdited = new Date(item?.updatedAt).getTime() - new Date(item?.createdAt).getTime() > 100;
  const diffTime = !isEdited ? getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime()) : getDiffTimeStr(new Date(item?.updatedAt).getTime(), today.getTime()) + " 수정";

  return (
    <div className="relative">
      <Link href={`/users/profiles/${item?.user?.id}`}>
        <a>
          <Profiles user={item?.user} emdPosNm={item.emdPosNm} diffTime={mounted ? diffTime : ""} size="sm" />
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
