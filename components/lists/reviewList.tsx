import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
// @api
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesReviewsResponse } from "@api/users/profiles/[id]/reviews";
// @components
import Profiles from "@components/profiles";

type ReviewListItem = GetProfilesDetailResponse["profile"]["sellUserReview"][0] | GetProfilesDetailResponse["profile"]["purchaseUserReview"][0] | GetProfilesReviewsResponse["reviews"][0];

interface ReviewListProps {
  list: ReviewListItem[];
}

const ReviewList = ({ list }: ReviewListProps) => {
  const router = useRouter();
  const { user } = useUser();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ul className="space-y-3">
      {list
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((item) => {
          const signature = item.role === "sellUser" ? "판매자" : item.role === "purchaseUser" ? "구매자" : null;
          const profile = item.role === "sellUser" ? item.sellUser : item.role === "purchaseUser" ? item.purchaseUser : null;
          const today = new Date();
          const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
          if (!signature || !profile) return null;

          if (user?.id?.toString() !== router.query.id) {
            return (
              <li key={item?.id}>
                <Link href={`/users/profiles/${profile?.id}`}>
                  <a className="block">
                    <Profiles user={profile!} signature={signature} diffTime={mounted ? diffTime : ""} size="sm" />
                    <p className="pt-1 pl-14">{item.text}</p>
                  </a>
                </Link>
              </li>
            );
          }

          return (
            <li key={item?.id}>
              <Link href={`/users/profiles/${profile?.id}`}>
                <a className="block">
                  <Profiles user={profile!} signature={signature} diffTime={mounted ? diffTime : ""} size="sm" />
                </a>
              </Link>
              <Link href={`/reviews/${item?.id}`}>
                <a className="block pt-1 pl-14">{item.text}</a>
              </Link>
            </li>
          );
        })}
    </ul>
  );
};

export default ReviewList;
