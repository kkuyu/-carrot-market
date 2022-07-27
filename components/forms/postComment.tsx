import { UseFormReturn } from "react-hook-form";
// @components
import Inputs from "@components/inputs";
import Buttons from "@components/buttons";

export interface PostCommentTypes {
  comment: string;
  reCommentRefId?: number | null;
}

export interface PostCommentProps extends React.HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<PostCommentTypes, object>;
  onValid: (validForm: PostCommentTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const PostComment = ({ formData, onValid, isSuccess, isLoading, ...rest }: PostCommentProps) => {
  const { register, handleSubmit } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4" {...rest}>
      <div className="space-y-1">
        <Inputs
          register={register("comment", {
            required: true,
          })}
          name="comment"
          type="text"
          kind="text"
          placeholder="댓글을 입력해주세요"
          appendButtons={
            <Buttons
              tag="button"
              type="submit"
              sort="icon-block"
              status="default"
              disabled={isLoading}
              text={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
};

export default PostComment;
