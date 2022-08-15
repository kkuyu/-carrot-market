import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Buttons from "@components/buttons";

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
          <Inputs
            register={register("content", {
              required: true,
            })}
            name="content"
            type="text"
            placeholder={`${commentType}을 입력해주세요`}
            appendButtons={
              <Buttons
                tag="button"
                type="submit"
                sort="icon-block"
                size="sm"
                status="default"
                disabled={isLoading}
                text={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z"></path>
                  </svg>
                }
                aria-label="검색"
              />
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
        <TextAreas
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
      <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={isLoading} />
    </form>
  );
};

export default EditStoryComment;
