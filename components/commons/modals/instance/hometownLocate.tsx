import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useCoords from "@libs/client/useCoords";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserRequestBody, PostUserResponse } from "@api/users";
import { PostDummyResponse } from "@api/users/dummy";
import { GetSearchBoundaryResponse } from "@api/address/searchBoundary";
import { GetSearchKeywordResponse } from "@api/address/searchKeyword";
// @components
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import SearchAddress, { SearchAddressTypes } from "@components/forms/searchAddress";
import Buttons from "@components/buttons";

interface HometownLocateProps {
  addrType: "MAIN" | "SUB";
}

const HometownLocate = ({ addrType }: HometownLocateProps) => {
  const { user, mutate: mutateUser } = useUser();
  const { state, longitude, latitude } = useCoords();
  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  const [searchedKeyword, setSearchedKeyword] = useState("");
  const searchAddressForm = useForm<SearchAddressTypes>();
  const { data: keywordData, error: keywordError } = useSWR<GetSearchKeywordResponse>(Boolean(searchedKeyword.length) ? `/api/address/searchKeyword?keyword=${searchedKeyword}` : null);
  const { data: boundaryData, error: boundaryError } = useSWR<GetSearchBoundaryResponse>(
    longitude && latitude ? `/api/address/searchBoundary?distance=${0.02}&posX=${longitude}&posY=${latitude}` : null
  );

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/users", {
    onSuccess: () => {
      mutateUser();
      closeModal(LayerModal, "HometownLocate");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, "GeoCodeDistrictError", {
            placement: "bottom",
            message: data.error.message,
          });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostDummyResponse>("/api/users/dummy", {
    onSuccess: () => {
      mutateUser();
      closeModal(LayerModal, "HometownLocate");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, "GeoCodeDistrictError", {
            placement: "bottom",
            message: data.error.message,
          });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const updateHometown = (updateData: PostUserRequestBody) => {
    // dummy user
    if (user?.id === -1) {
      if (updateDummyLoading) return;
      updateDummy(updateData);
      return;
    }
    // membership user
    if (updateUserLoading) return;
    updateUser(updateData);
  };

  const resetForm = () => {
    setSearchedKeyword("");
    searchAddressForm.setValue("keyword", "");
    searchAddressForm.setFocus("keyword");
  };

  const selectItem = (itemData: GetSearchBoundaryResponse["emdList"][0] | GetSearchKeywordResponse["emdList"][0]) => {
    if (user?.MAIN_emdPosNm === itemData.emdNm) {
      openToast<MessageToastProps>(MessageToast, "alreadyRegisteredAddress", {
        placement: "bottom",
        message: "이미 등록된 주소예요",
      });
      closeModal(LayerModal, "HometownLocate");
      return;
    }
    updateHometown({
      emdType: addrType,
      ...(addrType === "MAIN" ? { mainAddrNm: itemData.addrNm, mainDistance: 0.02 } : {}),
      ...(addrType === "SUB" ? { subAddrNm: itemData.addrNm, subDistance: 0.02 } : {}),
    });
  };

  return (
    <section className="container pb-5">
      {/* 읍면동 검색 폼 */}
      <div className="sticky top-0 left-0 -mx-5 px-5 pt-5 bg-white">
        <SearchAddress
          formData={searchAddressForm}
          onValid={(data: SearchAddressTypes) => {
            setSearchedKeyword(data.keyword);
          }}
          onReset={resetForm}
          searchedKeyword={searchedKeyword}
        />
        <span className="absolute top-full left-0 w-full h-2 bg-gradient-to-b from-white" />
      </div>

      {/* 키워드 검색 결과 */}
      {Boolean(searchedKeyword.length) && (
        <div className="mt-1">
          {!keywordData && !keywordError ? (
            // 로딩중
            <div className="py-2 text-center">
              <span className="text-gray-500">로딩중</span>
            </div>
          ) : keywordData?.emdList.length ? (
            // 검색결과 목록
            <ul className="divide-y">
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
        </div>
      )}

      {/* 위치 검색 결과 */}
      {!Boolean(searchedKeyword.length) && (
        <div className="mt-1">
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
            <ul className="divide-y">
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
        </div>
      )}
    </section>
  );
};

export default HometownLocate;
