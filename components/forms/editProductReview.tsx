import type { HTMLAttributes } from "react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { MannerValue } from "@prisma/client";
// @api
import { ProductMannerValues, ProductReviewScores } from "@api/products/reviews/types";
// @components
import Buttons from "@components/buttons";
import Labels from "@components/labels";
import TextAreas from "@components/textareas";
import CheckBoxes from "@components/checkBoxes";

export interface EditProductReviewTypes {
  role: "sellUser" | "purchaseUser";
  sellUserId: number;
  purchaseUserId: number;
  score: number;
  manners: MannerValue[];
  description: string;
}

interface EditProductReviewProps extends HTMLAttributes<HTMLFormElement> {
  formId: string;
  formData: UseFormReturn<EditProductReviewTypes, object>;
  onValid: (validForm: EditProductReviewTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditProductReview = (props: EditProductReviewProps) => {
  const { formId, formData, onValid, isLoading, isSuccess, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, getValues, resetField } = formData;

  const [editState, setEditState] = useState<{ score: number; isFoldMode: boolean }>({ score: 0, isFoldMode: true });

  return (
    <form id={formId} onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {/* 선호도 */}
      <div className="space-y-1">
        <div className="flex flex-wrap gap-2">
          {ProductReviewScores.map((score) => (
            <span key={score.value}>
              <input
                {...register("score", {
                  onChange: () => {
                    const currentScore = getValues("score");
                    setEditState((prev) => ({
                      ...prev,
                      score: currentScore,
                      isFoldMode: !Boolean(currentScore),
                    }));
                    resetField("manners");
                    resetField("description");
                  },
                })}
                type="radio"
                id={`score-${score.value}`}
                value={score.value}
                className="peer sr-only"
              />
              <label htmlFor={`score-${score.value}`} className="inline-block px-3 py-1 rounded-lg border peer-checked:text-white peer-checked:bg-orange-500 peer-checked:border-orange-500">
                {score.text}
              </label>
            </span>
          ))}
        </div>
      </div>
      {!editState.isFoldMode && (
        <>
          {/* 매너 */}
          <div className="space-y-1">
            {editState.score <= 40 ? (
              <Labels tag="span" htmlFor="manners" text="어떤점이 별로였나요" />
            ) : editState.score <= 60 ? (
              <Labels tag="span" htmlFor="manners" text="어떤점이 좋았나요?" />
            ) : editState.score <= 80 ? (
              <Labels tag="span" htmlFor="manners" text="어떤점이 최고였나요?" />
            ) : null}
            <div className="space-y-1">
              {ProductMannerValues?.filter((manner) => manner.validRole(getValues("role")) && manner.validScore(editState.score)).map((manner) => (
                <CheckBoxes<EditProductReviewTypes["manners"][number]>
                  key={manner.value}
                  register={register("manners", {
                    required: {
                      value: true,
                      message: "한 개 이상 선택해주세요",
                    },
                  })}
                  id={manner.value}
                  name="manners"
                  value={manner.value}
                  text={manner.text}
                  required={true}
                />
              ))}
            </div>
            <span className="empty:hidden invalid">{formState.errors.manners?.message}</span>
          </div>
          {/* 거래 경험 */}
          <div className="space-y-1">
            {editState.score <= 40 ? (
              <>
                <Labels text="아쉬웠던 점을 적어주세요" htmlFor="text" />
                <span className="text-gray-500">작성한 내용은 상대방에게 전달되지 않으니 안심하세요</span>
              </>
            ) : (
              <>
                <Labels text="따뜻한 거래 경험을 알려주세요" htmlFor="text" />
                <span className="text-gray-500">남겨주신 거래 후기는 상대방의 프로필에 공개돼요</span>
              </>
            )}
            <TextAreas<EditProductReviewTypes["description"]> register={register("description", {})} required minLength={10} name="description" placeholder={"여기에 적어주세요(선택사항)"} />
            <span className="empty:hidden invalid">{formState.errors.description?.message}</span>
          </div>
          <Buttons tag="button" type="submit" disabled={isLoading}>
            후기 남기기
          </Buttons>
        </>
      )}
    </form>
  );
};

export default EditProductReview;
