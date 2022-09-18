import { HTMLAttributes, Fragment } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Labels from "@components/labels";

export interface EditProductResumeTypes {
  originalPrice: number;
  currentPrice: number;
}

interface EditProductResumeProps extends HTMLAttributes<HTMLFormElement> {
  formType: "update";
  formData: UseFormReturn<EditProductResumeTypes, object>;
  onValid: SubmitHandler<EditProductResumeTypes>;
  isSuccess?: boolean;
  isLoading?: boolean;
  resumeDiffStr: string;
  nextResumeDiffStr: string;
}

const EditProductResume = (props: EditProductResumeProps) => {
  const { formType, formData, onValid, isSuccess, isLoading, resumeDiffStr, nextResumeDiffStr, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, setValue } = formData;

  // variable: invisible
  const originalPrice = formData.getValues("originalPrice");
  const discounts =
    originalPrice > 10000
      ? ["5%", "10%", "15%"].map((text) => ({ text, updateValue: originalPrice - originalPrice * (parseInt(text) / 100) }))
      : originalPrice >= 4000
      ? ["1000원", "2000원", "3000원"].map((text) => ({ text, updateValue: originalPrice - parseInt(text) }))
      : [];

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {originalPrice > 0 && (
        <div className="space-y-1">
          <Labels text="가격" htmlFor="currentPrice" className="sr-only" />
          <Inputs<EditProductResumeTypes["currentPrice"]>
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
              {discounts.map(({ text, updateValue }) => (
                <Fragment key={text}>
                  <Buttons tag="button" type="button" sort="round-box" size="sm" status="default" onClick={() => setValue("currentPrice", updateValue)} className="w-auto font-normal rounded-full">
                    {text}
                  </Buttons>
                </Fragment>
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

export default EditProductResume;
