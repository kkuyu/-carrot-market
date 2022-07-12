import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
import useMutation from "@libs/client/useMutation";
// @api
import { PostStoriesResponse } from "@api/stories";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoryUpload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const formData = useForm<EditStoryTypes>();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [uploadStory, { loading, data }] = useMutation<PostStoriesResponse>("/api/stories", {
    onSuccess: (data) => {
      router.replace(`/stories/${data.story.id}`);
    },
    onError: (data) => {
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
      uploadStory({ ...data, photos: "", ...currentAddr });
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

    uploadStory({ photos: photos.join(","), ...data, ...currentAddr });
  };

  useEffect(() => {
    setLayout(() => ({
      title: "동네생활 글쓰기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "upload-story",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
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

  // redirect: join
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${ssrUser?.currentAddr?.emdAddrNm}`,
      },
    };
  }

  return {
    props: {},
  };
});

export default StoryUpload;
