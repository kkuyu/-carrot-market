import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyEmailTypes {
  email: string;
}

interface VerifyEmailProps extends HTMLAttributes<HTMLFormElement> {
  formType: "confirm";
  formData: UseFormReturn<VerifyEmailTypes, object>;
  onValid: SubmitHandler<VerifyEmailTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const VerifyEmail = (props: VerifyEmailProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<VerifyEmailTypes["email"]>
          register={register("email", {
            required: {
              value: true,
              message: "이메일 주소를 입력해주세요",
            },
            pattern: {
              value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: "이메일 주소를 정확하게 입력해주세요",
            },
          })}
          name="email"
          type="email"
          required={true}
          placeholder="username@example.com"
        />
        <span className="empty:hidden invalid">{formState.errors.email?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="default" disabled={!formState.isValid || isLoading}>
        {!isSuccess ? "인증 메일 받기" : "인증 메일 다시 받기"}
      </Buttons>
    </form>
  );
};

export default VerifyEmail;
