import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
// @api
import { ReviewManners, ReviewMannersEnum, ReviewSatisfaction, ReviewSatisfactionEnum } from "@api/reviews/types";
// @components
import Buttons from "@components/buttons";
import Labels from "@components/labels";
import TextAreas from "@components/textareas";

export interface ReviewProductTypes {
  role: "sellUser" | "purchaseUser";
  satisfaction: ReviewSatisfactionEnum;
  manners: ReviewMannersEnum[];
  text: string;
}

interface ReviewProductProps extends React.HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<ReviewProductTypes, object>;
  onValid: (validForm: ReviewProductTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const ReviewProduct = ({ formData, onValid, isLoading, isSuccess, ...rest }: ReviewProductProps) => {
  const { register, handleSubmit, formState, watch, getValues, resetField } = formData;

  const satisfaction = watch("satisfaction");

  const mannersLabel = `어떤점이 ${satisfaction === "best" ? "최고였나요?" : satisfaction === "good" ? "좋았나요?" : satisfaction === "dislike" ? "별로였나요?" : ""}`;
  const mannersItems = !satisfaction ? [] : ReviewManners.filter((assessment) => assessment.role.includes(getValues("role")) && assessment.satisfaction.includes(satisfaction));

  useEffect(() => {
    resetField("manners");
    resetField("text");
  }, [satisfaction]);

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-5" {...rest}>
      {/* 선호도 */}
      <div>
        {ReviewSatisfaction.map((satisfaction) => (
          <span key={satisfaction.value}>
            <input {...register("satisfaction")} type="radio" id={satisfaction.value} value={satisfaction.value} className="peer sr-only" />
            <label htmlFor={satisfaction.value} className="inline-block mr-2 px-3 py-1 rounded-lg border peer-checked:text-white peer-checked:bg-orange-500 peer-checked:border-orange-500">
              {satisfaction.text}
            </label>
          </span>
        ))}
      </div>
      {/* 평가 */}
      {satisfaction && Boolean(mannersItems.length) && (
        <div className="space-y-1">
          <Labels tag="span" htmlFor="manners" text={mannersLabel} />
          <div className="space-y-1">
            {mannersItems.map((item) => (
              <span key={item.value} className="relative block">
                <input
                  {...register("manners", {
                    required: {
                      value: true,
                      message: "한 개 이상 선택해주세요",
                    },
                  })}
                  type="checkbox"
                  id={item.value}
                  value={item.value}
                  className="peer sr-only"
                />
                <svg className="absolute top-0.5 l-0 w-5 h-5 text-gray-300 peer-checked:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label htmlFor={item.value} className="pl-6">
                  {item.text}
                </label>
              </span>
            ))}
          </div>
          <span className="empty:hidden invalid">{formState.errors.manners?.message}</span>
        </div>
      )}
      {/* 게시글 내용 */}
      {satisfaction && satisfaction !== "dislike" && (
        <div className="space-y-1">
          <Labels text="따뜻한 거래 경험을 알려주세요" htmlFor="text" />
          <span className="text-gray-500">남겨주신 거래 후기는 상대방의 프로필에 공개돼요</span>
          <TextAreas
            register={register("text", {
              minLength: {
                value: 10,
                message: "10자 이상 입력해주세요",
              },
            })}
            required
            minLength="10"
            name="text"
            placeholder={"여기에 적어주세요(선택사항)"}
          />
          <span className="empty:hidden invalid">{formState.errors.text?.message}</span>
        </div>
      )}
      {/* 게시글 내용 */}
      {satisfaction && satisfaction === "dislike" && (
        <div className="space-y-1">
          <Labels text="아쉬웠던 점을 적어주세요" htmlFor="text" />
          <span className="text-gray-500">작성한 내용은 상대방에게 전달되지 않으니 안심하세요</span>
          <TextAreas
            register={register("text", {
              minLength: {
                value: 10,
                message: "10자 이상 입력해주세요",
              },
            })}
            required
            minLength="10"
            name="text"
            placeholder={"여기에 적어주세요(선택사항)"}
          />
          <span className="empty:hidden invalid">{formState.errors.text?.message}</span>
        </div>
      )}
      {satisfaction && <Buttons type="submit" text="후기 남기기" disabled={isLoading} />}
    </form>
  );
};

export default ReviewProduct;
