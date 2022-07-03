import type { NextPage } from "next";
import { useRouter } from "next/router";
import Image from "next/image";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Buttons from "@components/buttons";

interface UploadForm {
  photo: FileList;
  name: string;
  price: number;
  description: string;
}

const Upload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const [photoPreview, setPhotoPreview] = useState("");

  const { register, handleSubmit, formState, getValues, resetField } = useForm<UploadForm>();
  const [uploadProduct, { loading, data }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
      router.push(`/products/${data.product.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const changePhoto = () => {
    const photoValue = getValues("photo");
    if (photoValue && photoValue.length > 0) {
      const file = photoValue[0];
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const resetPhoto = () => {
    resetField("photo");
    setPhotoPreview("");
  };

  const submitUpload = async ({ photo, ...data }: UploadForm) => {
    if (loading) return;

    if (!photo || !photo.length) {
      uploadProduct({
        ...data,
        ...currentAddr,
      });
      return;
    }

    const form = new FormData();
    form.append("file", photo[0], user?.id + "");

    // get cloudflare file data
    const fileResponse: GetFileResponse = await (await fetch("/api/files")).json();
    if (!fileResponse.success) {
      const error = new Error("GetFileError");
      error.name = "GetFileError";
      console.error(error);
      return;
    }


    // upload image delivery
    const imageResponse: ImageDeliveryResponse = await (await fetch(fileResponse.uploadURL, { method: "POST", body: form })).json();
    if (!imageResponse.success) {
      const error = new Error("UploadFileError");
      error.name = "UploadFileError";
      console.error(error);
      return;
    }

    uploadProduct({
      photo: imageResponse.result.id,
      ...data,
      ...currentAddr,
    });
  };

  useEffect(() => {
    setLayout(() => ({
      title: "중고거래 글쓰기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "product-upload",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <form id="product-upload" onSubmit={handleSubmit(submitUpload)} noValidate className="space-y-5">
        {/* 이미지 업로드 */}
        <div>
          <label className="w-full flex items-center justify-center h-48 text-gray-600 border-2 border-dashed border-gray-300 rounded-md hover:text-orange-500 hover:border-orange-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <input {...register("photo", { onChange: changePhoto })} type="file" id="photo" className="sr-only" name="photo" accept="image/*" />
          </label>
        </div>
        {/* 이미지 미리보기 */}
        <div className="relative space-y-1">
          <span className="block font-semibold text-gray-700">이미지 미리보기</span>
          {photoPreview ? (
            <>
              <div className="relative border rounded-md">
                <span className="block pb-[80%]"></span>
                <Image src={photoPreview} alt="" layout="fill" objectFit="cover" className="bg-slate-300 rounded-md" />
              </div>
              <Buttons tag="button" type="button" sort="text-link" size="sm" status="default" text="미리보기 삭제" onClick={resetPhoto} className="absolute top-0 right-0" />
            </>
          ) : (
            <p className="text-gray-400">선택해주세요</p>
          )}
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
            type="text"
            kind="price"
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
            minLength="10"
            name="description"
            placeholder={`${currentAddr.emdPosNm}에 올릴 게시글 내용을 작성해주세요.`}
          />
          <span className="empty:hidden invalid">{formState.errors.description?.message}</span>
        </div>
        {/* 완료 */}
        <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={loading} />
      </form>
    </div>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
  const isDummyUser = Boolean(!req?.session?.user?.id);

  if (isDummyUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${req?.session?.dummyUser?.MAIN_emdAddrNm}`,
      },
    };
  }

  return {
    props: {},
  };
});

export default Upload;
