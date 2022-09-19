import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import CheckBoxes from "@components/checkBoxes";

export interface FilterProductTypes {
  includeSoldProducts: boolean;
}

interface FilterProductProps extends HTMLAttributes<HTMLFormElement> {
  formType: "update";
  formData: UseFormReturn<FilterProductTypes, object>;
  onValid: SubmitHandler<FilterProductTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const FilterProduct = (props: FilterProductProps) => {
  const { formType, formData, onValid, isLoading, isSuccess, className = "", ...restProps } = props;
  const { register, handleSubmit } = formData;

  return (
    <form onInput={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <CheckBoxes<FilterProductTypes["includeSoldProducts"]> register={register("includeSoldProducts", {})} name="includeSoldProducts" id="includeSoldProducts" text="거래가능만 보기" />
    </form>
  );
};

export default FilterProduct;
