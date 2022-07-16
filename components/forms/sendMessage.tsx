import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

export interface SendMessageTypes {
  text: string;
}

interface SendMessageProps extends React.HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<SendMessageTypes, object>;
  onValid: (validForm: SendMessageTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const SendMessage = ({ formData, onValid, isSuccess, isLoading, ...rest }: SendMessageProps) => {
  const { register, handleSubmit } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate {...rest}>
      <Inputs
        register={register("text", {
          required: {
            value: true,
            message: "메세지를 입력해주세요",
          },
        })}
        required
        placeholder=""
        name="text"
        type="text"
        kind="text"
        appendButtons={
          <Buttons
            tag="button"
            type="submit"
            sort="icon-block"
            status="default"
            text={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            }
            aria-label="전송"
          />
        }
      />
    </form>
  );
};

export default SendMessage;
