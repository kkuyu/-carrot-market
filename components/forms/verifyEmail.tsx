import { UseFormReturn } from "react-hook-form";

import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyEmailTypes {
  email: string;
}

interface VerifyEmailProps {
  formData: UseFormReturn<VerifyEmailTypes, object>;
  onValid: (validForm: VerifyEmailTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const VerifyEmail = ({ formData, onValid, isSuccess, isLoading }: VerifyEmailProps) => {
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div className="space-y-1">
        <Inputs
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
          kind="text"
          required={true}
          placeholder="username@example.com"
        />
        <span className="empty:hidden invalid">{formState.errors.email?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="default" text={!isSuccess ? "인증메일 받기" : isLoading ? "인증메일 받기" : "인증메일 다시 받기"} disabled={!formState.isValid || isLoading} />
    </form>
  );
};

export default VerifyEmail;
