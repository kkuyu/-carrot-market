import { Fragment, HTMLAttributes, useMemo } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import useSWR from "swr";
import { EmdType } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
// @api
import { GetSearchBoundaryResponse } from "@api/locate/searchBoundary";
// @components
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface EditHometownTypes {
  submitType?: string;
  emdType?: EmdType;
  mainAddrNm?: string;
  mainDistance?: number;
  subAddrNm?: string | null;
  subDistance?: number | null;
}

interface EditHometownProps extends HTMLAttributes<HTMLFormElement> {
  formType: "update";
  formData: UseFormReturn<EditHometownTypes, object>;
  onValid: SubmitHandler<EditHometownTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditHometown = (props: EditHometownProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, setValue } = formData;
  const { user, currentAddr } = useUser();

  // fetch data
  const { data: boundaryData } = useSWR<GetSearchBoundaryResponse>(
    currentAddr?.emdPosX && currentAddr?.emdPosY && currentAddr?.emdPosDx
      ? `/api/locate/searchBoundary?state=granted&posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}`
      : null
  );

  // variable: visible
  const structure = useMemo(() => {
    const location = [
      { key: EmdType.MAIN, text: user?.MAIN_emdPosNm, actions: ["update", "delete"] },
      { key: EmdType.SUB, text: Boolean(user?.SUB_emdPosNm) ? user?.SUB_emdPosNm : null, actions: ["update", "delete"] },
      { key: "ANOTHER", text: !Boolean(user?.SUB_emdPosNm) ? "새 동네 추가하기" : null, actions: ["create"] },
    ];
    const distance = [
      { key: EmdType.MAIN, name: "mainDistance" as keyof EditHometownTypes, posNm: user?.MAIN_emdPosNm, posDx: user?.MAIN_emdPosDx },
      { key: EmdType.SUB, name: "subDistance" as keyof EditHometownTypes, posNm: user?.SUB_emdPosNm, posDx: user?.SUB_emdPosDx },
    ];
    return { location, distance };
  }, [user]);

  return (
    <form onChange={handleSubmit(onValid)} onSubmit={handleSubmit(onValid)} noValidate className={`text-center space-y-8 ${className}`} {...restProps}>
      {/* 동네 선택 */}
      <div>
        <h2 className="text-lg">동네 선택</h2>
        <p className="mt-1 text-gray-500">최소 1개 이상 최대 2개까지 설정할 수 있어요.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {structure.location
            ?.filter(({ text }) => Boolean(text?.length))
            ?.map(({ key, text, actions }) => (
              <div key={key} className="relative">
                {actions.map((action) => {
                  const onClick = () => {
                    setValue("submitType", `${key}-${action}`);
                    handleSubmit(onValid)();
                  };
                  return (
                    <Fragment key={`${key}-${action}`}>
                      {action === "update" ? (
                        <Buttons tag="button" type="button" sort="round-box" status={user?.emdType === key ? "primary" : "default"} onClick={onClick} className="pr-10 !text-left text-ellipsis">
                          <span>{text}</span>
                          <span className="sr-only">{user?.emdType === key ? "(선택됨)" : "(선택)"}</span>
                        </Buttons>
                      ) : action === "create" ? (
                        <Buttons tag="button" type="button" sort="round-box" status="default" onClick={onClick}>
                          <Icons name="Plus" className="m-auto w-5 h-6" />
                          <span className="sr-only">{text}</span>
                        </Buttons>
                      ) : action === "delete" ? (
                        <Buttons tag="button" type="button" sort="icon-block" status="default" size="sm" onClick={onClick} className="absolute top-1/2 right-1.5 -translate-y-1/2">
                          <Icons name="XCircle" className={`m-auto w-6 h-6 ${user?.emdType === key ? "text-white" : ""}`} />
                          <span className="sr-only">{text} 삭제</span>
                        </Buttons>
                      ) : null}
                    </Fragment>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      {/* 범위 선택 */}
      {structure.distance
        ?.filter(({ key }) => user?.emdType === key)
        ?.map(({ key, name, posNm, posDx }) => (
          <div key={key}>
            <h2 className="text-lg">
              {posNm} <span className="inline-block min-w-[6.8rem] text-left">근처 동네 {boundaryData?.totalCount ? `${boundaryData?.totalCount}개` : ""}</span>
            </h2>
            <p className="mt-1 text-gray-500">선택한 범위의 게시글만 볼 수 있어요</p>
            <div className="mt-5">
              <input
                type="range"
                {...register(name, {
                  required: true,
                  min: 0.01,
                  max: 0.04,
                  valueAsNumber: true,
                  onChange: () => {
                    setValue("submitType", `${key}-update`);
                  },
                })}
                name={name}
                step={0.01}
                min={0.01}
                max={0.04}
                disabled={isLoading}
                className="block w-full cursor-pointer"
              />
              <span className="mt-1 flex justify-between text-sm text-gray-500 before:content-['내_동네'] after:content-['근처_동네']" aria-hidden="true" />
              <span className="sr-only">{`${posNm}에서 ${["가까운 동네", "조금 가까운 동네", "조금 먼 동네", "먼 동네"][posDx! * 100 - 1]}까지 설정되었습니다.`}</span>
            </div>
          </div>
        ))}
    </form>
  );
};

export default EditHometown;
