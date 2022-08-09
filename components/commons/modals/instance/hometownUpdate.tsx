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
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";
import HometownLocateModal, { HometownLocateModalProps, HometownLocateModalName } from "@components/commons/modals/case/hometownLocateModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

export interface HometownUpdateProps {}

interface DistanceForm {
  range: number;
}

const HometownUpdate = ({}: HometownUpdateProps) => {
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
          openModal<MessageModalProps>(MessageModal, "ConfirmLimitedAddress", {
            type: "confirm",
            message: "동네가 1개만 선택된 상태에서는 삭제를 할 수 없어요. 현재 설정된 동네를 변경하시겠어요?",
            cancelBtn: "취소",
            confirmBtn: "변경",
            hasBackdrop: true,
            onConfirm: () => {
              openModal<HometownLocateModalProps>(HometownLocateModal, HometownLocateModalName, {
                addrType: "MAIN",
              });
            },
          });
          return;
        }
        openModal<MessageModalProps>(MessageModal, "ConfirmDeleteMainAddress", {
          type: "confirm",
          message: "선택한 지역을 삭제하시겠습니까?",
          cancelBtn: "취소",
          confirmBtn: "삭제",
          hasBackdrop: true,
          onConfirm: () => {
            updateHometown({ emdType: "MAIN", mainAddrNm: user?.SUB_emdAddrNm!, mainDistance: user?.SUB_emdPosDx || 0.02, subAddrNm: null, subDistance: null });
          },
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
        openModal<MessageModalProps>(MessageModal, "ConfirmDeleteSubAddress", {
          type: "confirm",
          message: "선택한 지역을 삭제하시겠습니까?",
          cancelBtn: "취소",
          confirmBtn: "삭제",
          hasBackdrop: true,
          onConfirm: () => {
            updateHometown({ emdType: "MAIN", subAddrNm: null, subDistance: null });
          },
        });
      },
    },
    {
      key: "ANOTHER",
      text: "새 동네 추가하기",
      selectItem: () => {
        if (userType === "member") {
          openModal<HometownLocateModalProps>(HometownLocateModal, HometownLocateModalName, {
            addrType: "SUB",
          });
          return;
        }
        openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {});
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

  useEffect(() => {
    setValue("range", currentAddr?.emdPosDx || 0.02);
  }, [currentAddr.emdPosDx]);

  useEffect(() => {
    const focusTargetEl = addressWrapper.current?.querySelector(`.${user?.emdType}-select-button`) as HTMLElement | null;
    focusTargetEl?.focus();
  }, [user?.emdType]);

  return (
    <section className="container space-y-6 divide-y">
      {/* 주소 변경 */}
      <div ref={addressWrapper} className="pt-6 text-center">
        <h2 className="text-lg">동네 선택</h2>
        <p className="mt-1 text-gray-500">최소 1개 이상 최대 2개까지 설정할 수 있어요.</p>
        <div className="mt-6 flex space-x-2">
          {addressStructure.map(({ key, text, selectItem, removeItem }) => {
            return (
              <div key={key} className={`relative grow ${key === "SUB" && !user?.SUB_emdPosNm ? "hidden" : ""} ${key === "ANOTHER" && user?.SUB_emdPosNm ? "hidden" : ""}`}>
                {key === "ANOTHER" && (
                  <>
                    <Buttons
                      type="button"
                      sort="round-box"
                      status="default"
                      text={
                        <svg className="m-auto w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      }
                      onClick={selectItem}
                      className={`${key}-select-button`}
                      aria-label={text}
                    />
                  </>
                )}
                {key !== "ANOTHER" && (
                  <>
                    <Buttons
                      type="button"
                      sort="round-box"
                      status={user?.emdType === key ? "primary" : "default"}
                      text={text}
                      onClick={selectItem}
                      className={`${key}-select-button !text-left`}
                      aria-label={`${text} ${user?.emdType === key ? "선택 됨" : "선택"}`}
                    />
                    <Buttons
                      type="button"
                      sort="icon-block"
                      status="transparent"
                      text={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      }
                      onClick={removeItem}
                      className={`${key}-select-button absolute top-1/2 right-1 flex -translate-y-1/2 ${user?.emdType === key ? "text-white" : ""}`}
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
      <div className="pt-6 text-center">
        <form onChange={handleSubmit(distanceSubmit)} onSubmit={handleSubmit(distanceSubmit)} noValidate>
          <h2 className="text-lg">
            {currentAddr.emdPosNm} <span className="inline-block min-w-[6.8rem] text-left underline">근처 동네 {`${boundaryData?.record?.total ? boundaryData?.record?.total + "개" : ""}`}</span>
          </h2>
          <p className="mt-1 text-gray-500">선택한 범위의 게시글만 볼 수 있어요</p>
          <div className="mt-6">
            <input type="range" {...register("range", { required: true, min: 0.01, max: 0.05, valueAsNumber: true })} step={0.01} min={0.01} max={0.05} className="block w-full" />
            <div className="mt-1 flex justify-between text-sm text-gray-500 before:content-['내_동네'] after:content-['근처_동네']" aria-hidden="true" />
          </div>
        </form>
      </div>
    </section>
  );
};

export default HometownUpdate;
