import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Icons from "@components/icons";

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
          <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default" aria-label="전송">
            <Icons name="ArrowUpCircle" strokeWidth={1.5} className="w-6 h-6" />
          </Buttons>
        }
      />
    </form>
  );
};

export default EditChatMessage;
