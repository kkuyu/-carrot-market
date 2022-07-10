import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";

import { PageLayout } from "@libs/states";
import { PostCategoryEnum } from "@api/posts/types";
import { GetPostDetailResponse } from "@api/posts/[id]";
import { PostPostUpdateResponse } from "@api/posts/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import CommunityEdit, { CommunityEditTypes } from "@components/forms/communityEdit";

const Upload: NextPage<{
  staticProps: {
    post: GetPostDetailResponse["post"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);

  const formData = useForm<CommunityEditTypes>();
  const [uploadPost, { loading, data }] = useMutation<PostPostUpdateResponse>(`/api/posts/${router.query.id}/update`, {
    onSuccess: (data) => {
      router.replace(`/community/${data.post.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const setDefaultValue = async () => {
    if (!staticProps?.post) return;

    const transfer = new DataTransfer();
    const photos = staticProps?.post?.photo ? staticProps.post.photo.split(",") : [];
    console.log(photos);
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      transfer.items.add(file);
    }

    const { setValue } = formData;
    setValue("category", staticProps.post.category as PostCategoryEnum);
    setValue("photos", transfer.files);
    setValue("content", staticProps.post.content);
  };

  const submitPostUpload = async ({ photos, ...data }: CommunityEditTypes) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      uploadPost({
        ...data,
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

    uploadPost({
      photo: photo.join(","),
      ...data,
    });
  };

  useEffect(() => {
    setDefaultValue();

    setLayout(() => ({
      title: "동네생활 글 수정하기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "post-upload",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <CommunityEdit formId="post-upload" formData={formData} onValid={submitPostUpload} isLoading={loading || photoLoading} />
    </div>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }

  // redirect: join
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${ssrUser?.currentAddr?.emdAddrNm}`,
      },
    };
  }

  const postId = params?.id?.toString();

  // invalid params: postId
  // redirect: community
  if (!postId || isNaN(+postId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/community`,
      },
    };
  }

  // find post
  const post = await client.post.findUnique({
    where: {
      id: +postId,
    },
  });

  // invalid post: not found
  // redirect: community/[id]
  if (!post) {
    return {
      redirect: {
        permanent: false,
        destination: `/community/${postId}`,
      },
    };
  }

  // invalid post: not my post
  // redirect: community/[id]
  if (post.userId !== ssrUser?.profile?.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/community/${postId}`,
      },
    };
  }

  return {
    props: {
      staticProps: {
        post: JSON.parse(JSON.stringify(post || {})),
      },
    },
  };
});

export default Upload;
