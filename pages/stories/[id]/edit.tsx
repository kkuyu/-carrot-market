import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import useLayouts from "@libs/client/useLayouts";
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { PostStoriesUpdateResponse } from "@api/stories/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoriesEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data: storyData, mutate } = useSWR<GetStoriesDetailResponse>(router?.query?.id ? `/api/stories/${router.query.id}` : null);

  const formData = useForm<EditStoryTypes>({
    defaultValues: {
      category: storyData?.story?.category as EditStoryTypes["category"],
      content: storyData?.story?.content,
    },
  });

  const [photoLoading, setPhotoLoading] = useState(true);
  const [editStory, { loading }] = useMutation<PostStoriesUpdateResponse>(`/api/stories/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutate((prev) => prev && { ...prev, story: { ...prev?.story, ...data?.story } });
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

  const setDefaultPhotos = async () => {
    if (!storyData?.story?.photos) {
      setPhotoLoading(false);
      return;
    }

    const transfer = new DataTransfer();
    const photos = storyData?.story?.photos?.length ? storyData?.story.photos.split(";") : [];
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      if (file !== null) transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
    setPhotoLoading(false);
  };

  const submitStory = async ({ photos: _photos, ...data }: EditStoryTypes) => {
    if (!user || loading || photoLoading) return;

    if (!_photos?.length) {
      editStory({ ...data, photos: [] });
      return;
    }

    let photos = [];
    setPhotoLoading(true);
    for (let index = 0; index < _photos.length; index++) {
      // same photo
      if (storyData?.story?.photos && storyData?.story.photos.includes(_photos[index].name)) {
        photos.push(_photos[index].name);
        continue;
      }
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
    editStory({ photos, ...data });
  };

  useEffect(() => {
    if (!storyData?.story) return;
    setPhotoLoading(true);
    formData.setValue("category", storyData?.story?.category as EditStoryTypes["category"]);
    formData.setValue("content", storyData?.story?.content);
    setDefaultPhotos();
  }, [storyData]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {
        submitId: "edit-story",
      },
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditStory formId="edit-story" formData={formData} onValid={submitStory} isLoading={loading || photoLoading} emdPosNm={storyData?.story?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getStory: { response: GetStoriesDetailResponse };
}> = ({ getUser, getStory }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/stories/${getStory.response.story.id}`]: getStory.response,
        },
      }}
    >
      <StoriesEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // storyId
  const storyId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/stories/${storyId}`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // invalidUrl
  let invalidUrl = false;
  if (!storyId || isNaN(+storyId)) invalidUrl = true;
  // redirect `/stories/${storyId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // getStory
  const story = await client.story.findUnique({
    where: {
      id: +storyId,
    },
  });

  // invalidStory
  let invalidStory = false;
  if (!story) invalidStory = true;
  if (story?.userId !== ssrUser?.profile?.id) invalidStory = true;
  // redirect `/stories/${storyId}`
  if (invalidStory) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "글 수정 | 동네생활",
    },
    header: {
      title: "동네생활 글 수정",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getStory: {
        response: {
          success: true,
          story: JSON.parse(JSON.stringify(story || {})),
        },
      },
    },
  };
});

export default Page;
