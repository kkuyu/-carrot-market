import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @libs
import { getDiffTimeStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
// @api
import { GetProfilesReviewsResponse } from "@api/profiles/[id]/reviews/[filter]";
// @components
import Profiles from "@components/profiles";

type ReviewListItem = GetProfilesReviewsResponse["reviews"][number];

interface ReviewListProps extends HTMLAttributes<HTMLUListElement> {
  list: ReviewListItem[];
}

const ReviewList = (props: ReviewListProps) => {
  const { list, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`${className}`} {...restProps}>
      {list.map((item) => {
        const profile = item.role === "sellUser" ? item.sellUser : item.role === "purchaseUser" ? item.purchaseUser : null;
        const signature = item.role === "sellUser" ? "판매자" : item.role === "purchaseUser" ? "구매자" : null;

        if (!profile || !signature || item.description === "") return null;

        const today = new Date();
        const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());

        // user review
        if (user?.id?.toString() !== router.query.id) {
          return (
            <li key={item?.id}>
              <Link href={`/profiles/${profile?.id}`}>
                <a className="block">
                  <Profiles user={profile!} signature={signature} diffTime={mounted && diffTime ? diffTime : ""} size="sm" />
                  <p className="pt-1 pl-14 pb-3">{item.description}</p>
                </a>
              </Link>
            </li>
          );
        }

        // profiles review
        return (
          <li key={item?.id}>
            <Link href={`/profiles/${profile?.id}`}>
              <a className="block">
                <Profiles user={profile!} signature={signature} diffTime={mounted && diffTime ? diffTime : ""} size="sm" />
              </a>
            </Link>
            <Link href={`/products/reviews/${item?.id}`}>
              <a className="block pt-1 pl-14 pb-3">{item.description}</a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default ReviewList;
