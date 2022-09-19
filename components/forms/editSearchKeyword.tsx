import { HTMLAttributes, useEffect } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @libs
import useUser from "@libs/client/useUser";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Icons from "@components/icons";
import { useRouter } from "next/router";

export interface EditSearchKeywordTypes {
  searchKeyword: string;
  emdAddrNm: string | null;
  emdPosNm: string | null;
  emdPosX: number | null;
  emdPosY: number | null;
}

interface EditSearchKeywordProps extends HTMLAttributes<HTMLFormElement> {
  formType: "create";
  formData: UseFormReturn<EditSearchKeywordTypes, object>;
  onValid: SubmitHandler<EditSearchKeywordTypes>;
  onReset?: () => void;
}

const EditSearchKeyword = (props: EditSearchKeywordProps) => {
  const { formType, formData, onValid, onReset, className = "", ...restProps } = props;
  const { register, handleSubmit, getValues, setValue } = formData;
  const router = useRouter();
  const { currentAddr } = useUser();

  // update: formDataWithSearch
  useEffect(() => {
    if (!currentAddr) return;
    setValue("emdAddrNm", currentAddr?.emdAddrNm);
    setValue("emdPosNm", currentAddr?.emdPosNm);
    setValue("emdPosX", currentAddr?.emdPosX);
    setValue("emdPosY", currentAddr?.emdPosY);

    const keyword = router?.query?.keyword?.toString() || "";
    if (router.pathname === "/search/result/[models]") {
      if (getValues("searchKeyword") === keyword) {
        setValue("searchKeyword", keyword);
      } else {
        setValue("searchKeyword", keyword);
        handleSubmit(onValid)();
      }
    } else {
      setValue("searchKeyword", "");
    }
  }, [router?.query?.keyword, currentAddr]);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<EditSearchKeywordTypes["searchKeyword"]>
          register={register("searchKeyword", {
            required: true,
          })}
          name="searchKeyword"
          type="text"
          placeholder={currentAddr?.emdPosNm ? `${currentAddr?.emdPosNm} 근처에서 검색` : ""}
          appendButtons={
            <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default" aria-label="검색">
              <Icons name="MagnifyingGlass" className="w-5 h-5" />
            </Buttons>
          }
        />
      </div>
    </form>
  );
};

export default EditSearchKeyword;
