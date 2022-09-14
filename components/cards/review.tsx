import type { HTMLAttributes } from "react";
// @libs
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { GetProfilesDetailReviewsResponse } from "@api/profiles/[id]/reviews/[filter]";
// @components
import Profiles from "@components/profiles";

export type ReviewItem = GetProfilesDetailReviewsResponse["reviews"][number];

export interface ReviewProps extends HTMLAttributes<HTMLDivElement> {
  item: ReviewItem;
}

const Review = (props: ReviewProps) => {
  const { item, className = "", ...restProps } = props;

  // variable: visible
  const { isMounted, timeState } = useTimeDiff(item?.createdAt?.toString() || null);
  const profile = item.role === "sellUser" ? item.sellUser : item.role === "purchaseUser" ? item.purchaseUser : null;
  const signature = item.role === "sellUser" ? "판매자" : item.role === "purchaseUser" ? "구매자" : null;

  if (!profile || !signature) return null;
  if (item.description === "") return null;

  return (
    <div className={`block py-1 ${className}`} {...restProps}>
      <Profiles user={profile} signature={signature} diffTime={isMounted && timeState.diffStr ? timeState.diffStr : ""} size="sm" />
      <p className="mt-1 ml-11 pl-2">{item.description}</p>
    </div>
  );
};

export default Review;
