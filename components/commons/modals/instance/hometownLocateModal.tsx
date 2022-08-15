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
import { GetSearchBoundaryResponse } from "@api/address/searchBoundary";
import { GetSearchKeywordResponse } from "@api/address/searchKeyword";
import { PostUserRequestBody, PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import SearchKeyword, { SearchKeywordTypes } from "@components/forms/searchKeyword";
import Buttons from "@components/buttons";

export interface HometownLocateModalProps {
  addrType: "MAIN" | "SUB";
}

export const HometownLocateModalName = "HometownLocate";

const HometownLocateModal = (props: HometownLocateModalProps & LayerModalProps & ModalComponentProps) => {
  const { addrType } = props;
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { state, longitude, latitude } = useCoords();
  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  const [recentlyKeyword, setRecentlyKeyword] = useState("");
  const searchKeywordForm = useForm<SearchKeywordTypes>();
  const { data: keywordData, error: keywordError } = useSWR<GetSearchKeywordResponse>(Boolean(recentlyKeyword.length) ? `/api/address/searchKeyword?keyword=${recentlyKeyword}` : null);
  const { data: boundaryData, error: boundaryError } = useSWR<GetSearchBoundaryResponse>(
    longitude && latitude ? `/api/address/searchBoundary?distance=${0.02}&posX=${longitude}&posY=${latitude}` : null
  );

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/user", {
    onSuccess: () => {
      mutateUser();
      closeModal(HometownLocateModal, HometownLocateModalName);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, `UpdatedUser_${data.error.name}`, {
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
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostDummyResponse>("/api/user/dummy", {
    onSuccess: () => {
      mutateUser();
      closeModal(HometownLocateModal, HometownLocateModalName);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, `UpdatedUser_${data.error.name}`, {
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
    if (userType === "member") {
      if (updateUserLoading) return;
      updateUser(updateData);
      return;
    }
    if (updateDummyLoading) return;
    updateDummy(updateData);
  };

  const resetForm = () => {
    setRecentlyKeyword("");
    searchKeywordForm.setValue("keyword", "");
    searchKeywordForm.setFocus("keyword");
  };

  const selectItem = (itemData: GetSearchBoundaryResponse["emdList"][0] | GetSearchKeywordResponse["emdList"][0]) => {
    if (user?.MAIN_emdPosNm === itemData.emdNm) {
      openToast<MessageToastProps>(MessageToast, "AlreadyRegisteredAddress", {
        placement: "bottom",
        message: "이미 등록된 주소예요",
      });
      closeModal(HometownLocateModal, HometownLocateModalName);
      return;
    }
    updateHometown({
      emdType: addrType,
      ...(addrType === "MAIN" ? { mainAddrNm: itemData.addrNm, mainDistance: 0.02 } : {}),
      ...(addrType === "SUB" ? { subAddrNm: itemData.addrNm, subDistance: 0.02 } : {}),
    });
  };

  const modalOptions: HometownLocateModalProps & LayerModalProps = {
    ...props,
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 추가하기",
  };

  const modalProps: HometownLocateModalProps & LayerModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownLocateModalName,
    onOpen: () => openModal<HometownLocateModalProps>(HometownLocateModal, HometownLocateModalName, modalOptions),
    onClose: () => closeModal(HometownLocateModal, HometownLocateModalName),
  };

  return (
    <LayerModal {...modalProps}>
      <section className="container pb-5">
        {/* 읍면동 검색 폼 */}
        <div className="sticky top-0 left-0 -mx-5 px-5 pt-5 bg-white">
          <SearchKeyword
            formData={searchKeywordForm}
            onValid={(data: SearchKeywordTypes) => {
              setRecentlyKeyword(data.keyword);
            }}
            placeholder="동명(읍,면)으로 검색 (ex. 서초동)"
          >
            <Buttons tag="button" type="reset" text="현재위치로 찾기" onClick={resetForm} />
          </SearchKeyword>
          <div className="mt-5">
            <strong>{Boolean(recentlyKeyword?.length) ? `'${recentlyKeyword}' 검색 결과` : `근처 동네`}</strong>
          </div>
          <span className="absolute top-full left-0 w-full h-2 bg-gradient-to-b from-white" />
        </div>

        {/* 키워드 검색 결과 */}
        {Boolean(recentlyKeyword.length) && (
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
        {!Boolean(recentlyKeyword.length) && (
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
    </LayerModal>
  );
};

export default HometownLocateModal;
