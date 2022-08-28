import type { HTMLAttributes } from "react";
// @libs
import { getReviewManners } from "@libs/utils";
// @api
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesMannersResponse } from "@api/profiles/[id]/manners";
// @components
import Icons from "@components/icons";

type MannerListItem = GetProfilesMannersResponse["manners"][number] | GetProfilesDetailResponse["manners"][number];

interface MannerListProps extends HTMLAttributes<HTMLUListElement> {
  list: MannerListItem[];
}

const MannerList = (props: MannerListProps) => {
  const { list, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`space-y-1 ${className}`} {...restProps}>
      {list.map((item) => {
        const manner = getReviewManners(item.value);
        const count = item?.reviews?.length;
        if (!manner) return null;
        if (count === 0) return null;
        return (
          <li key={item.id}>
            <div className="flex items-start">
              <span className="grow-full pr-2">{manner.text}</span>
              <Icons name="ChatBubbleLeftRight" className="flex-none w-5 h-5" />
              <span className="px-2 font-semibold">{count}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MannerList;
