// @libs
import { getReviewManners } from "@libs/utils";
// @api
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesMannersResponse } from "@api/users/profiles/[id]/manners";

type MannerListItem = GetProfilesMannersResponse["manners"][0] | GetProfilesDetailResponse["manners"][0];

interface MannerListProps {
  list: MannerListItem[];
}

const MannerList = ({ list }: MannerListProps) => {
  return (
    <ul className="space-y-2">
      {list.map((item) => {
        const count = item?.reviews?.length;
        if (count === 0) {
          console.error("MannerList", item);
          return null;
        }
        return (
          <li key={item.id}>
            <div className="flex items-start">
              <span className="grow">{getReviewManners(item.value)?.text}</span>
              <svg className="flex-none w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
              <span className="px-2 font-semibold">{count}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MannerList;
