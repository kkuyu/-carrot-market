import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Labels from "@components/labels";

export interface ResumeProductTypes {
  price: number;
}

interface ResumeProductProps extends HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<ResumeProductTypes, object>;
  onValid: (validForm: ResumeProductTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
  originalPrice: number;
  targetDate: (Date | null)[];
  diffTime: string[];
}

const ResumeProduct = (props: ResumeProductProps) => {
  const { formData, onValid, isSuccess, isLoading, originalPrice, targetDate, diffTime, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, setValue } = formData;

  const discounts = originalPrice > 10000 ? ["5%", "10%", "15%"] : originalPrice >= 4000 ? ["1000원", "2000원", "3000원"] : [];
  const discountPrice = (discount: string) => {
    if (/%$/.test(discount)) setValue("price", originalPrice - originalPrice * (parseInt(discount) / 100));
    if (/원$/.test(discount)) setValue("price", originalPrice - parseInt(discount));
  };

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Labels text="가격" htmlFor="price" className="sr-only" />
        <Inputs<ResumeProductTypes["price"]>
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
        {!Boolean(discounts.length) && (
          <div className="pt-2">
            <span className="text-sm text-gray-500">0원을 입력하면 나눔을 할 수 있어요</span>
          </div>
        )}
        {Boolean(discounts.length) && (
          <div className="pt-2 flex items-center space-x-2">
            {discounts.map((discount) => (
              <Buttons key={discount} tag="button" type="button" sort="round-box" size="sm" status="default" onClick={() => discountPrice(discount)} className="!w-auto font-normal rounded-full">
                {discount}
              </Buttons>
            ))}
            <span className="text-sm">할인</span>
          </div>
        )}
      </div>
      {targetDate[1] && (
        <p>
          다음 끌어올리기는 <span className="text-orange-500">{diffTime[1]}</span>에 할 수 있어요
        </p>
      )}
      <Buttons tag="button" type="submit" disabled={isLoading}>
        끌어올리기
      </Buttons>
    </form>
  );
};

export default ResumeProduct;
