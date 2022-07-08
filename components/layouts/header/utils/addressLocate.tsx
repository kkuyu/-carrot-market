import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import useUser from "@libs/client/useUser";
import useCoords from "@libs/client/useCoords";

import { GetBoundarySearchResponse } from "@api/address/boundary-search";
import { GetKeywordSearchResponse } from "@api/address/keyword-search";

import Buttons from "@components/buttons";
import SearchAddress, { SearchAddressTypes } from "@components/forms/searchAddress";
import { ModalControl, ToastControl, UpdateHometown } from "@components/layouts/header";

interface AddressLocateProps {
  toastControl: ToastControl;
  modalControl: ModalControl;
  updateHometown: UpdateHometown;
  addrType: "MAIN" | "SUB";
}

const AddressLocate = ({ toastControl, modalControl, updateHometown, addrType }: AddressLocateProps) => {
  const { user } = useUser();
  const [keyword, setKeyword] = useState("");

  const searchAddressForm = useForm<SearchAddressTypes>();
  const { setValue: SearchAddressValue, setFocus: SearchAddressFocus } = searchAddressForm;

  const { state, longitude, latitude } = useCoords();
  const { data: boundaryData, error: boundaryError } = useSWR<GetBoundarySearchResponse>(
    longitude && latitude ? `/api/address/boundary-search?distance=${0.02}&posX=${longitude}&posY=${latitude}` : null
  );
  const { data: keywordData, error: keywordError } = useSWR<GetKeywordSearchResponse>(Boolean(keyword.length) ? `/api/address/keyword-search?keyword=${keyword}` : null);

  const resetForm = () => {
    setKeyword("");
    SearchAddressValue("keyword", "");
    SearchAddressFocus("keyword");
  };

  const selectItem = (itemData: GetBoundarySearchResponse["emdList"][0] | GetKeywordSearchResponse["emdList"][0]) => {
    if (user?.MAIN_emdPosNm === itemData.emdNm) {
      toastControl("alreadyRegisteredAddress", { open: true });
      modalControl("locateModal", { open: false });
      return;
    }
    modalControl("locateModal", {
      open: false,
      beforeClose: () =>
        updateHometown({
          emdType: addrType,
          ...(addrType === "MAIN" ? { mainAddrNm: itemData.addrNm, mainDistance: 0.02 } : {}),
          ...(addrType === "SUB" ? { subAddrNm: itemData.addrNm, subDistance: 0.02 } : {}),
        }),
    });
  };

  return (
    <section className="container pb-5">
      {/* 읍면동 검색 폼 */}
      <SearchAddress
        formData={searchAddressForm}
        onValid={(data: SearchAddressTypes) => {
          setKeyword(data.keyword);
        }}
        onReset={resetForm}
        stickyClass="top-0 left-0"
        keyword={keyword}
      />

      {/* 키워드 검색 결과 */}
      {Boolean(keyword.length) && (
        <>
          {!keywordData && !keywordError ? (
            // 로딩중
            <div className="py-2 text-center">
              <span className="text-gray-500">로딩중</span>
            </div>
          ) : keywordData?.emdList.length ? (
            // 검색결과 목록
            <ul className="-mt-2 divide-y">
              {keywordData.emdList.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => selectItem(item)} className="block w-full py-2 text-left">
                    {item.addrNm}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // 검색결과 없음
            <div className="py-2 text-center">
              <p className="text-gray-500">
                검색 결과가 없어요.
                <br />
                동네 이름을 다시 확인해주세요!
              </p>
              <Buttons tag="button" type="button" sort="text-link" text="동네 이름 다시 검색하기" onClick={resetForm} className="mt-2" />
            </div>
          )}
        </>
      )}

      {/* 위치 검색 결과 */}
      {!Boolean(keyword.length) && (
        <>
          {state === "denied" || state === "error" ? (
            // 위치 정보 수집 불가
            <div className="py-2 text-center">
              <span className="text-gray-500">
                위치 정보를 요청할 수 없어요.
                <br />
                내 위치를 확인하도록 허용하거나
                <br />
                동네 이름을 검색해 주세요!
              </span>
            </div>
          ) : !boundaryData && !boundaryError ? (
            // 로딩중
            <div className="py-2 text-center">
              <span className="text-gray-500">로딩중</span>
            </div>
          ) : boundaryData?.emdList.length ? (
            // 검색결과 목록
            <ul className="-mt-2 divide-y">
              {boundaryData.emdList.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => selectItem(item)} className="block w-full py-2 text-left">
                    {item.addrNm}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            // 검색결과 없음
            <div className="py-2 text-center">
              <p className="text-gray-500">
                검색 결과가 없어요.
                <br />
                동네 이름을 검색해 주세요!
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AddressLocate;
