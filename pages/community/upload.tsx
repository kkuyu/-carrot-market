import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { PostPostsResponse } from "@api/posts";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import CommunityEdit, { CommunityEditTypes } from "@components/forms/communityEdit";

const Upload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);

  const formData = useForm<CommunityEditTypes>();
  const [uploadPost, { loading, data }] = useMutation<PostPostsResponse>("/api/posts", {
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

  const submitPostUpload = async ({ photos, ...data }: CommunityEditTypes) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      uploadPost({
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

    uploadPost({
      photo: photo.join(","),
      ...data,
      ...currentAddr,
    });
  };

  useEffect(() => {
    setLayout(() => ({
      title: "동네생활 글쓰기",
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

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const profile = req?.session?.user?.id
    ? await client.user.findUnique({
        where: { id: req?.session?.user?.id },
      })
    : null;
  const dummyProfile = !profile ? req?.session?.dummyUser : null;

  if (dummyProfile) {
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
