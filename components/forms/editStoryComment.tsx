import type { HTMLAttributes } from "react";
import { Fragment } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @api
import { CommentTypeEnum } from "@api/comments/types";
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
  formType: "create" | "update";
  formData: UseFormReturn<EditStoryCommentTypes, object>;
  onValid: SubmitHandler<EditStoryCommentTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
  commentType?: CommentTypeEnum;
}

const EditStoryComment = (props: EditStoryCommentProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, commentType = CommentTypeEnum.comment, className = "", ...restProps } = props;
  const { register, handleSubmit, formState } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {formType === "create" ? (
        <Fragment>
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
                <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default" disabled={isLoading} aria-label="전송">
                  <Icons name="ArrowUpCircle" strokeWidth={1.5} className="w-6 h-6" />
                </Buttons>
              }
            />
            <span className="empty:hidden invalid">{formState.errors.content?.message}</span>
          </div>
        </Fragment>
      ) : (
        <Fragment>
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
              name="content"
              placeholder={`${commentType}을 입력해주세요`}
            />
            <span className="empty:hidden invalid">{formState.errors.content?.message}</span>
          </div>
          {/* 완료 */}
          <Buttons tag="button" type="submit" sort="round-box" disabled={isLoading}>
            완료
          </Buttons>
        </Fragment>
      )}
    </form>
  );
};

export default EditStoryComment;
