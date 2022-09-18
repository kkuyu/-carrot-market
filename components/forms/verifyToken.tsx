import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyTokenTypes {
  token: string;
}

interface VerifyTokenProps extends HTMLAttributes<HTMLFormElement> {
  formType: "confirm";
  formData: UseFormReturn<VerifyTokenTypes, object>;
  onValid: SubmitHandler<VerifyTokenTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
  userType?: "member" | "non-member";
}
const VerifyToken = (props: VerifyTokenProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, userType, className = "", ...restProps } = props;
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<VerifyTokenTypes["token"]>
          register={register("token", {
            required: true,
          })}
          name="token"
          type="number"
          required={true}
          placeholder="인증번호 입력"
        />
        <span className="notice">어떤 경우에도 타인에게 공유하지 마세요!</span>
        <span className="empty:hidden invalid">{formState.errors.token?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="primary" disabled={isLoading}>
        {userType === "non-member" ? "인증 번호 확인 및 회원가입" : "인증 번호 확인"}
      </Buttons>
    </form>
  );
};

export default VerifyToken;
