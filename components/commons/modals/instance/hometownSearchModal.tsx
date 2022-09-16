import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { EmdType } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useCoords from "@libs/client/useCoords";
import useMutation from "@libs/client/useMutation";
// @api
import { GetSearchBoundaryResponse } from "@api/locate/searchBoundary";
import { GetSearchKeywordResponse } from "@api/locate/searchKeyword";
import { PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import EditLocateKeyword, { EditLocateKeywordTypes } from "@components/forms/editLocateKeyword";
import LocateList, { LocateItem } from "@components/lists/locateList";

export interface HometownSearchModalProps {
  emdType: EmdType;
}

export const HometownSearchModalName = "HometownSearch";

const HometownSearchModal = (props: HometownSearchModalProps & LayerModalProps & ModalComponentProps) => {
  const { emdType } = props;
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { state, longitude, latitude, mutate: mutateCoords } = useCoords();
  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  // variable: invisible
  const [locateKeyword, setLocateKeyword] = useState("");

  const { data: searchData, error: searchError } = useSWR<GetSearchKeywordResponse | GetSearchBoundaryResponse>(
    Boolean(locateKeyword.length)
      ? `/api/locate/searchKeyword?keyword=${locateKeyword}`
      : state !== "loading"
      ? `/api/locate/searchBoundary?state=${state}&posX=${longitude}&posY=${latitude}&distance=${0.02}`
      : null
  );

  // mutation data
  const [updateUser, { loading: loadingUser }] = useMutation<PostUserResponse | PostDummyResponse>(userType === "member" ? "/api/user" : "/api/user/dummy", {
    onSuccess: async () => {
      await mutateUser();
      closeModal(HometownSearchModal, HometownSearchModalName);
    },
  });

  // variable: visible
  const formData = useForm<EditLocateKeywordTypes>({
    defaultValues: {
      locateKeyword: "",
      emdType,
    },
  });

  // variable: modal
  const modalOptions: HometownSearchModalProps & LayerModalProps = {
    ...props,
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 추가하기",
  };
  const modalProps: HometownSearchModalProps & LayerModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownSearchModalName,
    onOpen: () => openModal<HometownSearchModalProps>(HometownSearchModal, HometownSearchModalName, modalOptions),
    onClose: () => closeModal(HometownSearchModal, HometownSearchModalName),
  };

  // update: locateKeyword
  const submitLocate = (data: EditLocateKeywordTypes) => {
    setLocateKeyword(data.locateKeyword);
  };

  // update: locateKeyword
  const resetLocate = () => {
    mutateCoords();
    setLocateKeyword("");
    formData.setValue("locateKeyword", "");
    formData.setFocus("locateKeyword");
  };

  // update: User
  const selectLocate = (item: LocateItem) => {
    if (loadingUser) return;
    if (user?.MAIN_emdPosNm === item.emdNm || user?.SUB_emdPosNm === item.emdNm) {
      openToast<MessageToastProps>(MessageToast, "AlreadyRegisteredAddress", {
        placement: "bottom",
        message: "이미 등록된 주소예요",
      });
      closeModal(HometownSearchModal, HometownSearchModalName);
      return;
    }
    updateUser({
      emdType,
      ...(emdType === EmdType.MAIN ? { mainAddrNm: item.addrNm, mainDistance: 0.02 } : {}),
      ...(emdType === EmdType.SUB ? { subAddrNm: item.addrNm, subDistance: 0.02 } : {}),
    });
  };

  return (
    <LayerModal {...modalProps}>
      <section className="">
        {/* 검색 폼 */}
        <div className="fixed-container top-12 z-[50]">
          <div className="fixed-inner flex flex-col justify-between h-[9.25rem] px-5 pt-5 bg-white">
            <EditLocateKeyword formType="create" formData={formData} onValid={submitLocate} onReset={resetLocate} />
            <div className="">
              <strong>{`${Boolean(locateKeyword?.length) ? `${locateKeyword} 검색 결과` : "근처 동네"}`}</strong>
            </div>
            <span className="absolute top-full left-0 w-full h-2 bg-gradient-to-b from-white" />
          </div>
        </div>

        <div className="container pt-[9.25rem] pb-3">
          {/* 검색 결과: Loading */}
          {/* {!searchData && !searchError && <p className="list-loading">로딩중</p>} */}

          {/* 검색 결과: List */}
          {searchData && <LocateList status={searchData.status} list={searchData.emdList} selectLocate={selectLocate} resetLocate={resetLocate} />}
        </div>
      </section>
    </LayerModal>
  );
};

export default HometownSearchModal;
