import { UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface VerifyTokenTypes {
  token: string;
}

interface VerifyTokenProps {
  formData: UseFormReturn<VerifyTokenTypes, object>;
  onValid: (validForm: VerifyTokenTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const VerifyToken = ({ formData, onValid, isSuccess, isLoading }: VerifyTokenProps) => {
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
      <div className="space-y-1">
        <Inputs
          register={register("token", {
            required: true,
          })}
          name="token"
          type="number"
          kind="text"
          required={true}
          placeholder="인증번호 입력"
        />
        <span className="notice">어떤 경우에도 타인에게 공유하지 마세요!</span>
        <span className="empty:hidden invalid">{formState.errors.token?.message}</span>
      </div>
      <Buttons tag="button" type="submit" status="primary" text="인증번호 확인" disabled={isLoading} />
    </form>
  );
};

export default VerifyToken;
