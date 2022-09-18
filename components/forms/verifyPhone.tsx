import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyPhoneTypes {
  phone: string;
  targetEmail?: string;
}

interface VerifyPhoneProps extends HTMLAttributes<HTMLFormElement> {
  formType: "confirm";
  formData: UseFormReturn<VerifyPhoneTypes, object>;
  onValid: SubmitHandler<VerifyPhoneTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const VerifyPhone = (props: VerifyPhoneProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<VerifyPhoneTypes["phone"]>
          register={register("phone", {
            required: {
              value: true,
              message: "휴대폰 번호를 입력해주세요",
            },
            minLength: {
              value: 8,
              message: "8자 이상 입력해주세요",
            },
          })}
          name="phone"
          type="number"
          required={true}
          placeholder="휴대폰 번호(-없이 숫자만 입력)"
        />
        <span className="empty:hidden invalid">{formState.errors.phone?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="default" disabled={!formState.isValid || isLoading}>
        {!isSuccess ? "인증 문자 받기" : "인증 문자 다시 받기"}
      </Buttons>
    </form>
  );
};

export default VerifyPhone;
