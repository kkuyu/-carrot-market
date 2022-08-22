import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserRequestBody, PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
import { GetSearchBoundaryResponse } from "@api/address/searchBoundary";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import HometownLocateModal, { HometownLocateModalProps, HometownLocateModalName } from "@components/commons/modals/instance/hometownLocateModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface HometownUpdateModalProps {}

interface DistanceForm {
  range: number;
}

export const HometownUpdateModalName = "HometownUpdate";

const HometownUpdateModal = (props: HometownUpdateModalProps & LayerModalProps & ModalComponentProps) => {
  const { user, currentAddr, type: userType, mutate: mutateUser } = useUser();
  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/user", {
    onSuccess: () => {
      mutateUser();
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

  // address
  const originalAddr = useRef({ emdPosDx: currentAddr.emdPosDx, emdType: user?.emdType });
  const addressWrapper = useRef<HTMLDivElement>(null);
  const addressStructure = [
    {
      key: "MAIN",
      text: user?.MAIN_emdPosNm || "MAIN",
      selectItem: () => {
        updateHometown({ emdType: "MAIN" });
      },
      removeItem: () => {
        if (!user?.SUB_emdAddrNm) {
          openModal<AlertModalProps>(AlertModal, "ConfirmLimitedAddress", {
            message: "동네가 1개만 선택된 상태에서는 삭제를 할 수 없어요.\n현재 설정된 동네를 변경하시겠어요?",
            actions: [
              {
                key: "cancel",
                style: AlertStyleEnum["cancel"],
                text: "취소",
                handler: null,
              },
              {
                key: "destructive",
                style: AlertStyleEnum["destructive"],
                text: "변경",
                handler: () => openModal<HometownLocateModalProps>(HometownLocateModal, HometownLocateModalName, { addrType: "MAIN" }),
              },
            ],
          });
          return;
        }
        openModal<AlertModalProps>(AlertModal, "ConfirmDeleteMainAddress", {
          message: "선택한 지역을 삭제하시겠습니까?",
          actions: [
            {
              key: "cancel",
              style: AlertStyleEnum["cancel"],
              text: "취소",
              handler: null,
            },
            {
              key: "destructive",
              style: AlertStyleEnum["destructive"],
              text: "삭제",
              handler: () => updateHometown({ emdType: "MAIN", mainAddrNm: user?.SUB_emdAddrNm!, mainDistance: user?.SUB_emdPosDx || 0.02, subAddrNm: null, subDistance: null }),
            },
          ],
        });
      },
    },
    {
      key: "SUB",
      text: user?.SUB_emdPosNm || "SUB",
      selectItem: () => {
        updateHometown({ emdType: "SUB" });
      },
      removeItem: () => {
        openModal<AlertModalProps>(AlertModal, "ConfirmDeleteSubAddress", {
          message: "선택한 지역을 삭제하시겠습니까?",
          actions: [
            {
              key: "cancel",
              style: AlertStyleEnum["cancel"],
              text: "취소",
              handler: null,
            },
            {
              key: "destructive",
              style: AlertStyleEnum["destructive"],
              text: "삭제",
              handler: () => updateHometown({ emdType: "MAIN", subAddrNm: null, subDistance: null }),
            },
          ],
        });
      },
    },
    {
      key: "ANOTHER",
      text: "새 동네 추가하기",
      selectItem: () => {
        if (userType === "member") {
          openModal<HometownLocateModalProps>(HometownLocateModal, HometownLocateModalName, { addrType: "SUB" });
          return;
        }
        openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
      },
      removeItem: () => null,
    },
  ];

  // distance
  const { register, handleSubmit, setValue } = useForm<DistanceForm>();
  const { data: boundaryData } = useSWR<GetSearchBoundaryResponse>(
    currentAddr.emdPosX && currentAddr.emdPosY && currentAddr.emdPosDx ? `/api/address/searchBoundary?distance=${currentAddr.emdPosDx}&posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}` : null
  );
  const distanceSubmit = (data: DistanceForm) => {
    updateHometown({
      ...(user?.emdType === "MAIN" ? { mainDistance: data.range } : {}),
      ...(user?.emdType === "SUB" ? { subDistance: data.range } : {}),
    });
  };

  const modalOptions: HometownUpdateModalProps & LayerModalProps = {
    ...props,
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 설정하기",
  };

  const modalProps: HometownUpdateModalProps & LayerModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownUpdateModalName,
    onOpen: () => openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, modalOptions),
    onClose: () => closeModal(HometownUpdateModal, HometownUpdateModalName),
  };

  useEffect(() => {
    if (originalAddr.current.emdPosDx === currentAddr?.emdPosDx) return;
    originalAddr.current = { ...originalAddr.current, emdPosDx: currentAddr?.emdPosDx };
    setValue("range", currentAddr?.emdPosDx || 0.02);
  }, [currentAddr?.emdPosDx]);

  useEffect(() => {
    if (originalAddr.current.emdType === user?.emdType) return;
    originalAddr.current = { ...originalAddr.current, emdType: user?.emdType };
    (addressWrapper.current?.querySelector(`.${user?.emdType}-select-button`) as HTMLElement | null)?.focus();
  }, [user?.emdType]);

  return (
    <LayerModal {...modalProps}>
      <section className="container pt-5 pb-5">
        {/* 주소 변경 */}
        <div ref={addressWrapper} className="text-center">
          <h2 className="text-lg">동네 선택</h2>
          <p className="mt-1 text-gray-500">최소 1개 이상 최대 2개까지 설정할 수 있어요.</p>
          <div className="mt-5 flex space-x-2">
            {addressStructure.map(({ key, text, selectItem, removeItem }) => {
              return (
                <div key={key} className={`relative grow shrink basis-0 w-0 ${key === "SUB" && !user?.SUB_emdPosNm ? "hidden" : ""} ${key === "ANOTHER" && user?.SUB_emdPosNm ? "hidden" : ""}`}>
                  {key === "ANOTHER" && (
                    <>
                      <Buttons
                        tag="button"
                        type="button"
                        sort="round-box"
                        status="default"
                        text={<Icons name="Plus" className="m-auto w-6 h-6" />}
                        onClick={selectItem}
                        className={`${key}-select-button`}
                        aria-label={text}
                      />
                    </>
                  )}
                  {key !== "ANOTHER" && (
                    <>
                      <Buttons
                        tag="button"
                        type="button"
                        sort="round-box"
                        status={user?.emdType === key ? "primary" : "default"}
                        text={text}
                        onClick={selectItem}
                        className={`${key}-select-button pr-12 !text-left overflow-hidden whitespace-nowrap overflow-ellipsis`}
                        aria-label={`${text} ${user?.emdType === key ? "선택 됨" : "선택"}`}
                      />
                      <Buttons
                        tag="button"
                        type="button"
                        sort="icon-block"
                        status="default"
                        size="sm"
                        text={<Icons name="XCircle" className="w-6 h-6" />}
                        onClick={removeItem}
                        className={`${key}-select-button absolute top-1/2 right-1.5 flex -translate-y-1/2 ${user?.emdType === key ? "text-white" : ""}`}
                        aria-label={`${text} 삭제`}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 검색범위 변경 */}
        <div className="mt-5 pt-5 text-center border-t">
          <form onChange={handleSubmit(distanceSubmit)} onSubmit={handleSubmit(distanceSubmit)} noValidate>
            <h2 className="text-lg">
              {currentAddr.emdPosNm} <span className="inline-block min-w-[6.8rem] text-left underline">근처 동네 {`${boundaryData?.record?.total ? boundaryData?.record?.total + "개" : ""}`}</span>
            </h2>
            <p className="mt-1 text-gray-500">선택한 범위의 게시글만 볼 수 있어요</p>
            <div className="mt-5">
              <input type="range" {...register("range", { required: true, min: 0.01, max: 0.05, valueAsNumber: true })} step={0.01} min={0.01} max={0.05} className="block w-full" />
              <div className="mt-1 flex justify-between text-sm text-gray-500 before:content-['내_동네'] after:content-['근처_동네']" aria-hidden="true" />
            </div>
          </form>
        </div>
      </section>
    </LayerModal>
  );
};

export default HometownUpdateModal;
