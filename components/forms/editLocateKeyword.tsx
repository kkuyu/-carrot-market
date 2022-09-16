import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { EmdType } from "@prisma/client";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Icons from "@components/icons";

export interface EditLocateKeywordTypes {
  emdType: EmdType;
  locateKeyword: string;
}

interface EditLocateKeywordProps extends HTMLAttributes<HTMLFormElement> {
  formType: "create";
  formData: UseFormReturn<EditLocateKeywordTypes, object>;
  onValid: SubmitHandler<EditLocateKeywordTypes>;
  onReset?: () => void;
}

const EditLocateKeyword = (props: EditLocateKeywordProps) => {
  const { formType, formData, onValid, onReset, className = "", ...restProps } = props;
  const { register, handleSubmit } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<EditLocateKeywordTypes["locateKeyword"]>
          register={register("locateKeyword", {
            required: true,
          })}
          name="locateKeyword"
          type="text"
          placeholder="동명(읍,면)으로 검색 (ex. 서초동)"
          appendButtons={
            <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default" aria-label="검색">
              <Icons name="MagnifyingGlass" className="w-5 h-5" />
            </Buttons>
          }
        />
      </div>
      {onReset && (
        <Buttons tag="button" type="reset" onClick={onReset}>
          현재위치로 찾기
        </Buttons>
      )}
    </form>
  );
};

export default EditLocateKeyword;
