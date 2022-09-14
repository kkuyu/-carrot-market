import type { HTMLAttributes } from "react";
// @api
import { ProductMannerValues } from "@api/products/reviews/types";
import { GetProfilesDetailMannersResponse } from "@api/profiles/[id]/manners/[filter]";
// @components
import Icons from "@components/icons";

type MannerItem = GetProfilesDetailMannersResponse["manners"][number];

interface MannerListProps extends HTMLAttributes<HTMLUListElement> {
  list: MannerItem[];
}

const MannerList = (props: MannerListProps) => {
  const { list, className = "", ...restProps } = props;

  if (!Boolean(list.length)) return null;

  return (
    <ul className={`${className}`} {...restProps}>
      {list.map((item) => {
        const manner = ProductMannerValues.find((manner) => manner.value === item.value);
        if (!manner) return null;
        if (item._count.reviews === 0) return null;
        return (
          <li key={item.id}>
            <div className="flex items-start py-1 space-x-2">
              <strong className="grow-full font-normal">{manner.text}</strong>
              <span className="inline-flex items-center space-x-1">
                <Icons name="ChatBubbleLeftRight" className="flex-none w-4 h-4" />
                <em className="font-semibold not-italic">{item._count.reviews}</em>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MannerList;
