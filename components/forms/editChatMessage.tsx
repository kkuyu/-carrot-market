import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

export interface EditChatMessageTypes {
  text: string;
}

interface EditChatMessageProps extends HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<EditChatMessageTypes, object>;
  onValid: (validForm: EditChatMessageTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditChatMessage = (props: EditChatMessageProps) => {
  const { formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <Inputs<EditChatMessageTypes["text"]>
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
        appendButtons={
          <Buttons
            tag="button"
            type="submit"
            sort="icon-block"
            size="sm"
            status="default"
            text={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

export default EditChatMessage;
