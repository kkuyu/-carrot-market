import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useUser from "@libs/client/useUser";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Labels from "@components/labels";
import Inputs from "@components/inputs";
import TextAreas from "@components/textareas";
import Files, { Thumbnail, UpdateFiles, validateFiles } from "@components/files";
import Buttons from "@components/buttons";

interface ProductUploadForm {
  photos: FileList;
  name: string;
  price: number;
  description: string;
}

const Upload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { openToast } = useToast();
  const { user, currentAddr } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const photoOptions = { maxLength: 10, acceptTypes: ["image/jpeg", "image/png", "image/gif"] };

  const { register, handleSubmit, formState, getValues, setValue } = useForm<ProductUploadForm>();
  const [uploadProduct, { loading, data }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
      setPhotoLoading(false);
      router.push(`/products/${data.product.id}`);
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

  const changePhotos = () => {
    const photos = getValues("photos");

    // check empty
    if (!photos?.length) {
      setThumbnails([]);
      return;
    }

    // check options
    const { errors, validFiles } = validateFiles(photos, photoOptions);
    if (errors?.acceptTypes) {
      openToast<MessageToastProps>(MessageToast, "invalid-photos-acceptTypes", {
        placement: "bottom",
        message: "jpg, png, gif 형식의 파일만 등록할 수 있어요",
      });
    }
    if (errors?.maxLength) {
      openToast<MessageToastProps>(MessageToast, "invalid-photos-maxLength", {
        placement: "bottom",
        message: `최대 ${photoOptions.maxLength}개까지 등록할 수 있어요.`,
      });
    }

    // set thumbnails
    setThumbnails(
      validFiles.map((file: File) => ({
        preview: URL.createObjectURL(file),
        raw: file,
      }))
    );
  };

  const updatePhotos: UpdateFiles = (type, thumb) => {
    const transfer = new DataTransfer();
    const originalFiles = getValues("photos");

    switch (type) {
      case "remove":
        Array.from(originalFiles)
          .filter((file) => file !== thumb?.raw)
          .forEach((file) => transfer.items.add(file));
        break;
      default:
        console.error("updatePhotos", type);
        return;
    }

    setValue("photos", transfer.files);
    changePhotos();
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
            register={register("photos", {
              onChange: changePhotos,
            })}
            name="photos"
            accept="image/*"
            maxLength={photoOptions.maxLength}
            multiple={true}
            thumbnails={thumbnails}
            updateFiles={updatePhotos}
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
