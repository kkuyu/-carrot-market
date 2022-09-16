import type { HTMLAttributes } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Labels from "@components/labels";

export interface ResumeProductTypes {
  originalPrice: number;
  currentPrice: number;
}

interface ResumeProductProps extends HTMLAttributes<HTMLFormElement> {
  formType: "update";
  formData: UseFormReturn<ResumeProductTypes, object>;
  onValid: SubmitHandler<ResumeProductTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
  resumeDiffStr: string;
  nextResumeDiffStr: string;
}

const ResumeProduct = (props: ResumeProductProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, resumeDiffStr, nextResumeDiffStr, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, setValue } = formData;

  // variable: visible
  const discounts = formData.getValues("originalPrice") > 10000 ? ["5%", "10%", "15%"] : formData.getValues("originalPrice") >= 4000 ? ["1000원", "2000원", "3000원"] : [];

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {formData.getValues("originalPrice") > 0 && (
        <div className="space-y-1">
          <Labels text="가격" htmlFor="currentPrice" className="sr-only" />
          <Inputs<ResumeProductTypes["currentPrice"]>
            register={register("currentPrice", {
              required: {
                value: true,
                message: "가격을 입력해주세요",
              },
              valueAsNumber: true,
            })}
            required
            placeholder=""
            name="currentPrice"
            type="number"
            prependText="₩"
          />
          <span className="empty:hidden invalid">{formState.errors.currentPrice?.message}</span>
          {Boolean(discounts.length) ? (
            <div className="pt-2 flex items-center space-x-2">
              {discounts.map((discount) => (
                <Buttons
                  key={discount}
                  tag="button"
                  type="button"
                  sort="round-box"
                  size="sm"
                  status="default"
                  onClick={() => {
                    let price = formData.getValues("originalPrice");
                    if (/%$/.test(discount)) price = formData.getValues("originalPrice") - formData.getValues("originalPrice") * (parseInt(discount) / 100);
                    if (/원$/.test(discount)) price = formData.getValues("originalPrice") - parseInt(discount);
                    setValue("currentPrice", Math.floor(price / 100) * 100);
                  }}
                  className="!w-auto font-normal rounded-full"
                >
                  {discount}
                </Buttons>
              ))}
              <span className="text-sm">할인</span>
            </div>
          ) : (
            <div className="pt-2">
              <span className="text-sm text-gray-500">0원을 입력하면 나눔을 할 수 있어요</span>
            </div>
          )}
        </div>
      )}
      {nextResumeDiffStr && (
        <p>
          다음 끌어올리기는 <span className="text-orange-500">{nextResumeDiffStr}</span>에 할 수 있어요
        </p>
      )}
      <Buttons tag="button" type="submit" disabled={isLoading}>
        끌어올리기
      </Buttons>
    </form>
  );
};

export default ResumeProduct;
