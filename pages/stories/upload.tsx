import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
import useMutation from "@libs/client/useMutation";
// @api
import { PostStoriesResponse } from "@api/stories";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import CustomHead from "@components/custom/head";
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoryUpload: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();

  const formData = useForm<EditStoryTypes>();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [uploadStory, { loading }] = useMutation<PostStoriesResponse>("/api/stories", {
    onSuccess: (data) => {
      router.replace(`/stories/${data.story.id}`);
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

  const submitUploadStory = async ({ photos: _photos, ...data }: EditStoryTypes) => {
    if (loading || photoLoading) return;

    if (!_photos || !_photos.length) {
      uploadStory({ ...data, photos: [], ...currentAddr });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
      // new photo
      const form = new FormData();
      form.append("file", _photos[index], `${user?.id}-${index}-${_photos[index].name}`);
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
      photos.push(imageResponse.result.id);
    }

    uploadStory({ photos, ...data, ...currentAddr });
  };

  useEffect(() => {
    changeLayout({
      header: {
        title: "동네생활 글 쓰기",
        titleTag: "h1",
        utils: ["back", "title", "submit"],
        submitId: "upload-story",
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <CustomHead title="글 쓰기 | 동네생활" />
      <EditStory formId="upload-story" formData={formData} onValid={submitUploadStory} isLoading={loading || photoLoading} emdPosNm={currentAddr?.emdPosNm || ""} />
    </div>
  );
};

export const getServerSideProps = withSsrSession(async ({ req }) => {
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

  // redirect: stories
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories`,
      },
    };
  }

  return {
    props: {},
  };
});

export default StoryUpload;
