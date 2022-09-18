import type { HTMLAttributes } from "react";
// @api
import { GetSearchBoundaryResponse } from "@api/locate/searchBoundary";
import { GetSearchKeywordResponse } from "@api/locate/searchKeyword";
// @components
import Buttons from "@components/buttons";

export type LocateItem = GetSearchKeywordResponse["emdList"][number] | GetSearchBoundaryResponse["emdList"][number];

interface LocateListProps extends HTMLAttributes<HTMLUListElement | HTMLParagraphElement> {
  status: GetSearchBoundaryResponse["status"] | GetSearchKeywordResponse["status"];
  list: LocateItem[];
  selectLocate: (item: LocateItem) => void;
  resetLocate: () => void;
}

const LocateList = (props: LocateListProps) => {
  const { status, list, selectLocate, resetLocate, className = "", ...restProps } = props;

  if (status === "boundary-undefined") {
    return (
      <p className="list-empty">
        위치 정보를 요청할 수 없어요.
        <br />
        내 위치를 확인하도록 허용하거나
        <br />
        동네 이름을 검색해 주세요!
      </p>
    );
  }

  if (status === "boundary-empty") {
    return (
      <p className="list-empty">
        근처 동네를 확인 할 수 없어요.
        <br />
        동네 이름을 검색해 주세요!
      </p>
    );
  }

  if (status === "keyword-empty") {
    return (
      <p className="list-empty">
        검색 결과가 없어요.
        <br />
        동네 이름을 다시 확인해주세요!
        <br />
        <Buttons tag="button" type="button" sort="text-link" onClick={resetLocate} className="mt-2 block">
          동네 이름 다시 검색하기
        </Buttons>
      </p>
    );
  }

  if (status === "boundary-list" && !Boolean(list.length)) {
    return null;
  }

  if (status === "keyword-list" && !Boolean(list.length)) {
    return null;
  }

  return (
    <ul className={`${className}`} {...restProps}>
      {list?.map((item) => (
        <li key={item?.id}>
          <Buttons tag="button" type="button" sort="text-link" status="unset" onClick={() => selectLocate(item)} className="block w-full py-1.5">
            {item.addrNm}
          </Buttons>
        </li>
      ))}
    </ul>
  );
};

export default LocateList;
