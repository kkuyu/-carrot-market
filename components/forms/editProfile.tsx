import Link from "next/link";
import type { HTMLAttributes } from "react";
import { UseFormReturn } from "react-hook-form";
// @libs
import { getRandomName } from "@libs/utils";
import useUser from "@libs/client/useUser";
// @api
import { ProfilesConcernEnum, ProfilesConcern } from "@api/profiles/types";
// @components
import Labels from "@components/labels";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

export interface EditProfileTypes {
  photos?: FileList;
  name: string;
  concerns?: ProfilesConcernEnum[];
}

interface EditProfileProps extends HTMLAttributes<HTMLFormElement> {
  formId: string;
  formData: UseFormReturn<EditProfileTypes, object>;
  onValid: (validForm: EditProfileTypes) => void;
  isSuccess?: boolean;
  isLoading?: boolean;
}

const EditProfile = (props: EditProfileProps) => {
  const { formId, formData, onValid, isSuccess, isLoading, className = "", ...restProps } = props;
  const { register, handleSubmit, formState, watch, setValue } = formData;
  const { type: userType } = useUser();

  const fileOptions = {
    maxLength: 10,
    duplicateDelete: true,
    acceptTypes: ["image/jpeg", "image/png", "image/gif"],
  };

  const makeRandomName = () => {
    const name = getRandomName();
    setValue("name", name);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onValid)} noValidate className={`space-y-5 ${className}`} {...restProps}>
      {userType !== "member" && (
        <p className="text-notice">
          프로필 사진 및 관심사 설정은
          <Link href="/account/phone" passHref>
            <Buttons tag="a" sort="text-link" status="default" text="휴대폰 인증" className="align-top" />
          </Link>
          후 이용 가능합니다.
        </p>
      )}
      {/* 이미지 업로드 */}
      {userType === "member" && (
        <div className="space-y-1">
          <Files register={register("photos")} name="photos" fileOptions={fileOptions} currentFiles={watch("photos")} changeFiles={(value) => setValue("photos", value)} accept="image/*" />
          <span className="empty:hidden invalid">{formState.errors.photos?.message}</span>
        </div>
      )}
      {/* 닉네임 */}
      <div className="space-y-1">
        <Labels text="닉네임" htmlFor="name" />
        <Inputs
          register={register("name", {
            required: {
              value: true,
              message: "닉네임을 입력해주세요",
            },
          })}
          required
          name="name"
          type="text"
          appendButtons={
            <Buttons
              tag="button"
              type="button"
              sort="icon-block"
              size="sm"
              status="default"
              text={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              onClick={makeRandomName}
              aria-label="랜덤"
            />
          }
        />
        <span className="empty:hidden invalid">{formState.errors.name?.message}</span>
      </div>
      {/* 관심사 */}
      {userType === "member" && (
        <div className="space-y-1">
          <Labels text="관심사" htmlFor="concerns" />
          <div>
            <p className="text-gray-500">나의 관심사를 선택해 보세요.</p>
            {ProfilesConcern.map((concern) => (
              <span key={concern.value}>
                <input {...register("concerns")} type="checkbox" id={concern.value} value={concern.value} className="peer sr-only" />
                <label htmlFor={concern.value} className="inline-block mt-2 mr-2 px-3 py-1 rounded-lg border peer-checked:text-white peer-checked:bg-gray-600 peer-checked:border-gray-600">
                  {concern.emoji} {concern.text}
                </label>
              </span>
            ))}
          </div>
          <span className="empty:hidden invalid">{formState.errors.concerns?.message}</span>
        </div>
      )}
      {/* 완료 */}
      <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={isLoading} />
    </form>
  );
};

export default EditProfile;
