import type { NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { validateFiles, submitFiles, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { StoryPhotoOptions } from "@api/stories/types";
import { GetStoriesDetailResponse, getStoriesDetail } from "@api/stories/[id]";
import { PostStoriesUpdateResponse } from "@api/stories/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoriesEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);
  const [isValidStory, setIsValidStory] = useState(true);

  // fetch data
  const { data: storyData, mutate: mutateStory } = useSWR<GetStoriesDetailResponse>(router?.query?.id ? `/api/stories/${router.query.id}?` : null);

  // mutation data
  const [updateStory, { loading: loadingStory }] = useMutation<PostStoriesUpdateResponse>(`/api/stories/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutateStory();
      await router.replace(`/stories/${data.story.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: form
  const formData = useForm<EditStoryTypes>({
    defaultValues: {
      originalPhotoPaths: storyData?.story?.photos,
      category: storyData?.story?.category as EditStoryTypes["category"],
      content: storyData?.story?.content,
      emdAddrNm: storyData?.story?.emdAddrNm,
      emdPosNm: storyData?.story?.emdPosNm,
      emdPosX: storyData?.story?.emdPosX,
      emdPosY: storyData?.story?.emdPosY,
    },
  });

  // update: Story
  const submitStory = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditStoryTypes) => {
    if (loadingStory || isLoading) return;
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, StoryPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    updateStory({ ...data, photos: validPaths });
  };

  // update: isValidStory
  useEffect(() => {
    if (loadingStory) return;
    const isInvalid = {
      user: !(storyData?.storyCondition?.role?.myRole === "author"),
    };
    // invalid
    if (!storyData?.success || !storyData?.story || Object.values(isInvalid).includes(true)) {
      setIsValidStory(false);
      const storyId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/stories/${storyId}`);
      return;
    }
    // valid
    setIsValidStory(true);
  }, [loadingStory, storyData]);

  // update: formData
  useEffect(() => {
    if (!storyData?.story) return;
    formData.setValue("originalPhotoPaths", storyData?.story?.photos);
    formData.setValue("category", storyData?.story?.category as EditStoryTypes["category"]);
    formData.setValue("content", storyData?.story?.content);
    formData.setValue("emdAddrNm", storyData?.story?.emdAddrNm);
    formData.setValue("emdPosNm", storyData?.story?.emdPosNm);
    formData.setValue("emdPosX", storyData?.story?.emdPosX);
    formData.setValue("emdPosY", storyData?.story?.emdPosY);
  }, [storyData?.story]);

  if (!isValidStory) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="container pt-5 pb-5">
      <EditStory id="edit-story" formType="update" formData={formData} onValid={submitStory} isLoading={loadingStory || isLoading} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getStoriesDetail: { options: { url: string; query: string }; response: GetStoriesDetailResponse };
}> = ({ getUser, getStoriesDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getStoriesDetail?.options?.url}?${getStoriesDetail?.options?.query}`]: getStoriesDetail.response,
        },
      }}
    >
      <StoriesEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const storyId = params?.id?.toString() || "";

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/stories/${storyId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // getStoriesDetail
  const storiesDetail =
    storyId && !isNaN(+storyId)
      ? await getStoriesDetail({
          id: +storyId,
          userId: ssrUser?.profile?.id,
        })
      : {
          story: null,
          storyCondition: null,
        };
  if (!storiesDetail?.story) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  const isInvalid = {
    user: !(storiesDetail?.storyCondition?.role?.myRole === "author"),
  };

  // isInvalid
  // redirect: redirectDestination ?? `/stories/${storyId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/stories/${storyId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `글 수정 | ${truncateStr(storiesDetail?.story?.content, 15)} | 중고거래`,
    },
    header: {
      title: "동네생활 글 수정",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "edit-story",
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getStoriesDetail: {
        options: {
          url: `/api/stories/${storyId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(storiesDetail || {})),
        },
      },
    },
  };
});

export default Page;
