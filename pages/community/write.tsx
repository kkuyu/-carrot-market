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
import { PostPostsResponse } from "@api/posts";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Labels from "@components/labels";
import TextAreas from "@components/textareas";
import Files, { Thumbnail, UpdateFiles, validateFiles } from "@components/files";
import Buttons from "@components/buttons";

interface PostWriteForm {
  photos: FileList;
  question: string;
}

const Write: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { openToast } = useToast();
  const { user, currentAddr } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const photoOptions = { maxLength: 10, acceptTypes: ["image/jpeg", "image/png", "image/gif"] };

  const { register, handleSubmit, formState, getValues, setValue } = useForm<PostWriteForm>();
  const [postWrite, { loading, data }] = useMutation<PostPostsResponse>("/api/posts", {
    onSuccess: (data) => {
      router.push(`/community/${data.post.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitPostWrite = async ({ photos, ...data }: PostWriteForm) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      postWrite({
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

    postWrite({
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
      title: "동네생활 글쓰기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "post-write",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <form id="post-write" onSubmit={handleSubmit(submitPostWrite)} noValidate className="space-y-5">
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
        {/* 게시글 내용 */}
        <div className="space-y-1">
          <Labels text="게시글 내용" htmlFor="description" />
          <TextAreas
            register={register("question", {
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
            placeholder={`${currentAddr.emdPosNm} 우리동네 관련된 질문이나 이야기를 해보세요.`}
          />
          <span className="empty:hidden invalid">{formState.errors.question?.message}</span>
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

export default Write;
