import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @api
import { ProductCategoryEnum, ProductCategory } from "@api/products/types";
// @components
import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Selects from "@components/selects";

export interface EditProductTypes {
  photos: FileList;
  category: ProductCategoryEnum;
  name: string;
  price: number;
  description: string;
}

interface EditProductProps extends HTMLAttributes<HTMLFormElement> {
  formId: string;
  formData: UseFormReturn<EditProductTypes, object>;
  onValid: (validForm: EditProductTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
  emdPosNm: string;
}

const EditProduct = (props: EditProductProps) => {
  const { formId, formData, onValid, isSuccess, isLoading, emdPosNm, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, resetField, watch, getValues, setValue } = formData;

  const fileOptions = {
    maxLength: 10,
    duplicateDelete: true,
    acceptTypes: ["image/jpeg", "image/png", "image/gif"],
  };

  const updateValue = (name: string, value: any) => {
    const registerName = name as keyof EditProductTypes;
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
      {/* 글 제목 */}
      <div className="space-y-1">
        <Labels text="글 제목" htmlFor="name" />
        <Inputs
          register={register("name", {
            required: {
              value: true,
              message: "글 제목을 입력해주세요",
            },
          })}
          required
          name="name"
          type="text"
        />
        <span className="empty:hidden invalid">{formState.errors.name?.message}</span>
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
          options={[{ value: "", text: "카테고리 선택" }, ...ProductCategory]}
          currentValue={watch("category")}
          updateValue={updateValue}
          required
          name="category"
        />
        <span className="empty:hidden invalid">{formState.errors.category?.message}</span>
      </div>
      {/* 가격 */}
      <div className="space-y-1">
        <Labels text="가격" htmlFor="price" />
        <Inputs
          register={register("price", {
            required: {
              value: true,
              message: "가격을 입력해주세요",
            },
            valueAsNumber: true,
          })}
          required
          placeholder=""
          name="price"
          type="number"
          prependText="₩"
        />
        <span className="empty:hidden invalid">{formState.errors.price?.message}</span>
      </div>
      {/* 게시글 내용 */}
      <div className="space-y-1">
        <Labels text="게시글 내용" htmlFor="description" />
        <TextAreas
          register={register("description", {
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
          name="description"
          placeholder={emdPosNm ? `${emdPosNm}에 올릴 게시글 내용을 작성해주세요.` : `게시글 내용을 작성해주세요.`}
        />
        <span className="empty:hidden invalid">{formState.errors.description?.message}</span>
      </div>
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={isLoading} />
    </form>
  );
};

export default EditProduct;
