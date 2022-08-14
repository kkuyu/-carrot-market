import CheckBoxes from "@components/checkBoxes";
import { UseFormReturn } from "react-hook-form";

export interface FilterProductTypes {
  excludeSold: boolean;
}

interface FilterProductProps extends React.HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<FilterProductTypes, object>;
  onValid: (validForm: FilterProductTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const FilterProduct = (props: FilterProductProps) => {
  const { formData, onValid, isLoading, isSuccess, className = "", ...restProps } = props;
  const { register, handleSubmit } = formData;

  return (
    <form onInput={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <CheckBoxes register={register("excludeSold", {})} name="excludeSold" id="excludeSold" text="거래가능만 보기" />
    </form>
  );
};

export default FilterProduct;
