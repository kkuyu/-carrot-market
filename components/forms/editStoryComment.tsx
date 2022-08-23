import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface EditStoryCommentTypes {
  content: string;
  reCommentRefId?: number | null;
}

interface EditStoryCommentProps extends HTMLAttributes<HTMLFormElement> {
  formId?: string;
  formData: UseFormReturn<EditStoryCommentTypes, object>;
  onValid: (validForm: EditStoryCommentTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
  commentType?: "댓글" | "답변" | "답글";
}

const EditStoryComment = (props: EditStoryCommentProps) => {
  const { formId, formData, onValid, isSuccess, isLoading, commentType = "댓글", className = "", ...restProps } = props;
  const { register, handleSubmit, formState } = formData;

  if (!formId) {
    return (
      <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
        {/* 댓글/답변/답글 */}
        <div className="space-y-1">
          <Inputs<EditStoryCommentTypes["content"]>
            register={register("content", {
              required: true,
            })}
            name="content"
            type="text"
            placeholder={`${commentType}을 입력해주세요`}
            appendButtons={
              <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default" disabled={isLoading}>
                <Icons name="ArrowUpCircle" strokeWidth={1.5} className="w-6 h-6" />
              </Buttons>
            }
          />
        </div>
      </form>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {/* 댓글/답변/답글 */}
      <div className="space-y-1">
        <Labels text={commentType} htmlFor="content" />
        <TextAreas<EditStoryCommentTypes["content"]>
          register={register("content", {
            required: {
              value: true,
              message: `${commentType}을 입력해주세요`,
            },
          })}
          required={true}
          minLength={10}
          name="content"
          placeholder={`${commentType}을 입력해주세요`}
        />
        <span className="empty:hidden invalid">{formState.errors.content?.message}</span>
      </div>
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" disabled={isLoading}>
        완료
      </Buttons>
    </form>
  );
};

export default EditStoryComment;
