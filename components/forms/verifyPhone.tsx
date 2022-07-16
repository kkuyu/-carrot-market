import { UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyPhoneTypes {
  phone: string;
  targetEmail?: string;
}

interface VerifyPhoneProps extends React.HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<VerifyPhoneTypes, object>;
  onValid: (validForm: VerifyPhoneTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const VerifyPhone = ({ formData, onValid, isSuccess, isLoading, ...rest }: VerifyPhoneProps) => {
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4" {...rest}>
      <div className="space-y-1">
        <Inputs
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
          kind="text"
          required={true}
          placeholder="휴대폰 번호(-없이 숫자만 입력)"
        />
        <span className="empty:hidden invalid">{formState.errors.phone?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="default" text={!isSuccess ? "인증문자 받기" : isLoading ? "인증문자 받기" : "인증문자 다시 받기"} disabled={!formState.isValid || isLoading} />
    </form>
  );
};

export default VerifyPhone;
