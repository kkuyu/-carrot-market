import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import useSWR from "swr";
import useUser from "@libs/client/useUser";

import { GetBoundarySearchResponse } from "@api/address/boundary-search";

import Buttons from "@components/buttons";
import { ModalControl, ToastControl, UpdateHometown } from "@components/layouts/header";

interface AddressUpdateProps {
  toastControl: ToastControl;
  modalControl: ModalControl;
  updateHometown: UpdateHometown;
}

interface DistanceForm {
  range: number;
}

const AddressUpdate = ({ toastControl, modalControl, updateHometown }: AddressUpdateProps) => {
  const { user, currentAddr } = useUser();

  const { register, handleSubmit, setValue } = useForm<DistanceForm>();

  const { data: boundaryData } = useSWR<GetBoundarySearchResponse>(
    currentAddr.emdPosX && currentAddr.emdPosY && currentAddr.emdPosDx ? `/api/address/boundary-search?distance=${currentAddr.emdPosDx}&posX=${currentAddr.emdPosX}&posY=${currentAddr.emdPosY}` : null
  );

  const distanceSubmit = (data: DistanceForm) => {
    updateHometown({
      ...(user?.emdType === "MAIN" ? { mainDistance: data.range } : {}),
      ...(user?.emdType === "SUB" ? { subDistance: data.range } : {}),
    });
  };

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
          modalControl("oneOrMore", { open: true });
          return;
        }
        updateHometown({ emdType: "MAIN", mainAddrNm: user.SUB_emdAddrNm, mainDistance: user?.SUB_emdPosDx || 0.02, subAddrNm: null, subDistance: null });
      },
    },
    {
      key: "SUB",
      text: user?.SUB_emdPosNm || "SUB",
      selectItem: () => {
        updateHometown({ emdType: "SUB" });
      },
      removeItem: () => {
        updateHometown({ emdType: "MAIN", subAddrNm: null, subDistance: null });
      },
    },
    {
      key: "ANOTHER",
      text: "새 동네 추가하기",
      selectItem: () => {
        // dummy user
        if (user?.id === -1) {
          modalControl("signUpNow", { open: true });
          return;
        }
        // membership user
        modalControl("locateModal", { open: true });
      },
      removeItem: () => null,
    },
  ];

  useEffect(() => {
    const focusTargetEl = addressWrapper.current?.querySelector(`.${user?.emdType}-select-button`) as HTMLElement | null;
    focusTargetEl?.focus();
  }, [user?.emdType]);

  useEffect(() => {
    setValue("range", currentAddr?.emdPosDx || 0.02);
  }, [currentAddr.emdPosDx]);

  return (
    <section className="container space-y-6 divide-y">
      <div ref={addressWrapper} className="pt-6 text-center">
        <h2 className="text-lg">동네 선택</h2>
        <p className="mt-1 text-sm text-gray-500">지역은 최소 1개 이상 최대 2개까지 설정할 수 있어요.</p>
        <div className="mt-5 flex space-x-2">
          {addressStructure.map(({ key, text, selectItem, removeItem }) => {
            return (
              <div key={key} className={`relative grow ${key === "SUB" && !user?.SUB_emdPosNm ? "hidden" : ""} ${key === "ANOTHER" && user?.SUB_emdPosNm ? "hidden" : ""}`}>
                {key === "ANOTHER" && (
                  <>
                    <Buttons
                      type="button"
                      sort="round-box"
                      size="base"
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
                      size="base"
                      status={user?.emdType === key ? "primary" : "default"}
                      text={text}
                      onClick={selectItem}
                      className={`${key}-select-button text-left`}
                      aria-label={`${text} ${user?.emdType === key ? "선택 됨" : "선택"}`}
                    />
                    <Buttons
                      type="button"
                      sort="icon-block"
                      size="base"
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

      <form onChange={handleSubmit(distanceSubmit)} onSubmit={handleSubmit(distanceSubmit)} noValidate className="pt-6 text-center">
        <h2 className="text-lg">
          {currentAddr.emdPosNm} <span className="inline-block min-w-[6.8rem] text-left underline">근처 동네 {`${boundaryData?.record?.total ? boundaryData?.record?.total + "개" : ""}`}</span>
        </h2>
        <p className="mt-1 text-sm text-gray-500">선택한 범위의 게시글만 볼 수 있어요</p>
        <div className="mt-5">
          <input type="range" {...register("range", { required: true, min: 0.01, max: 0.05, valueAsNumber: true })} step={0.01} min={0.01} max={0.05} className="block w-full" />
          <div className="mt-1 flex justify-between text-sm text-gray-500 before:content-['내_동네'] after:content-['근처_동네']" aria-hidden="true" />
        </div>
      </form>
    </section>
  );
};

export default AddressUpdate;
