import { UseFormReturn } from "react-hook-form";
// @api
import { StoryCategoryEnum, StoryCategory } from "@api/stories/types";
// @components
import Labels from "@components/labels";
import TextAreas from "@components/textareas";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Selects from "@components/selects";

export interface EditStoryTypes {
  photos: FileList;
  category: StoryCategoryEnum;
  content: string;
}

interface EditStoryProps extends React.HTMLAttributes<HTMLFormElement> {
  formId: string;
  formData: UseFormReturn<EditStoryTypes, object>;
  onValid: (validForm: EditStoryTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
  emdPosNm: string;
}

const EditStory = (props: EditStoryProps) => {
  const { formId, formData, onValid, isSuccess, isLoading, emdPosNm, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, resetField, watch, getValues, setValue } = formData;

  const fileOptions = {
    maxLength: 10,
    duplicateDelete: true,
    acceptTypes: ["image/jpeg", "image/png", "image/gif"],
  };

  const updateValue = (name: string, value: any) => {
    const registerName = name as keyof EditStoryTypes;
    resetField(registerName);
    setValue(registerName, value);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {/* 이미지 업로드 */}
      <div className="space-y-1">
        <Files
          register={register("photos")}
          name="photos"
          fileOptions={fileOptions}
          currentFiles={watch("photos")}
          changeFiles={(value) => setValue("photos", value)}
          accept="image/*"
          multiple={true}
        />
        <span className="empty:hidden invalid">{formState.errors.photos?.message}</span>
      </div>
      {/* 카테고리 */}
      <div className="space-y-1">
        <Labels tag="span" text="카테고리" htmlFor="category" />
        <Selects
          register={register("category", {
            required: {
              value: true,
              message: "카테고리를 선택해주세요",
            },
          })}
          options={[{ value: "", text: "카테고리 선택" }, ...StoryCategory]}
          currentValue={watch("category")}
          updateValue={updateValue}
          required
          name="category"
        />
        <span className="empty:hidden invalid">{formState.errors.category?.message}</span>
      </div>
      {/* 게시글 내용 */}
      <div className="space-y-1">
        <Labels text="게시글 내용" htmlFor="content" />
        <TextAreas
          register={register("content", {
            required: {
              value: true,
              message: "게시글 내용을 입력해주세요",
            },
            minLength: {
              value: 10,
              message: "10자 이상 입력해주세요",
            },
          })}
          required
          minLength={10}
          name="content"
          placeholder={emdPosNm ? `${emdPosNm}에 올릴 게시글 내용을 작성해주세요.` : `게시글 내용을 작성해주세요.`}
        />
        <span className="empty:hidden invalid">{formState.errors.content?.message}</span>
      </div>
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={isLoading} />
    </form>
  );
};

export default EditStory;
