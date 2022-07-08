import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { ProductCategoryEnum, ProductCategory } from "@api/products/types";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Files from "@components/files";
import Buttons from "@components/buttons";
import Selects from "@components/selects";

interface ProductUploadForm {
  photos: FileList;
  category: ProductCategoryEnum;
  name: string;
  price: number;
  description: string;
}

const Upload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);
  const photoOptions = { maxLength: 10, acceptTypes: ["image/jpeg", "image/png", "image/gif"] };

  const { register, handleSubmit, formState, resetField, watch, getValues, setValue } = useForm<ProductUploadForm>();
  const [uploadProduct, { loading, data }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
      setPhotoLoading(false);
      router.replace(`/products/${data.product.id}`);
    },
    onError: (data) => {
      setPhotoLoading(false);
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const updateValue = (name: string, value: any) => {
    const registerName = name as keyof ProductUploadForm;
    resetField(registerName);
    setValue(registerName, value);
  };

  const submitProductUpload = async ({ photos, ...data }: ProductUploadForm) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      uploadProduct({
        ...data,
        ...currentAddr,
      });
      return;
    }

    let photo = [];
    setPhotoLoading(true);

    for (let index = 0; index < photos.length; index++) {
      const form = new FormData();
      form.append("file", photos[index], `${user?.id}-${index}-${photos[index].name}`);

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

      photo.push(imageResponse.result.id);
    }

    uploadProduct({
      photo: photo.join(","),
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
      <form id="product-upload" onSubmit={handleSubmit(submitProductUpload)} noValidate className="space-y-5">
        {/* 이미지 업로드 */}
        <div className="space-y-1">
          <Files
            register={register("photos")}
            name="photos"
            photoOptions={photoOptions}
            currentValue={watch("photos")}
            changeValue={(value) => setValue("photos", value)}
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
        <Buttons tag="button" type="submit" sort="round-box" text="완료" disabled={loading || photoLoading} />
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
