import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getStoryCondition, validateFiles, submitFiles, truncateStr } from "@libs/utils";
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

  // fetch data
  const { data: storyData, mutate: mutateStory } = useSWR<GetStoriesDetailResponse>(router?.query?.id ? `/api/stories/${router.query.id}` : null);

  // mutation data
  const [editStory, { loading: loadingStory }] = useMutation<PostStoriesUpdateResponse>(`/api/stories/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutateStory();
      router.replace(`/stories/${data.story.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: visible
  const formData = useForm<EditStoryTypes>({
    defaultValues: {
      originalPhotoPaths: storyData?.story?.photos,
      category: storyData?.story?.category as EditStoryTypes["category"],
      content: storyData?.story?.content,
    },
  });

  // update: Story
  const submitStory = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditStoryTypes) => {
    if (!user || loadingStory || isLoading) return;
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, StoryPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    editStory({ ...data, photos: validPaths });
  };

  useEffect(() => {
    if (!storyData?.story) return;
    formData.setValue("originalPhotoPaths", storyData?.story?.photos);
    formData.setValue("category", storyData?.story?.category as EditStoryTypes["category"]);
    formData.setValue("content", storyData?.story?.content);
  }, [storyData]);

  return (
    <div className="container pt-5 pb-5">
      <EditStory formId="edit-story" formData={formData} onValid={submitStory} isLoading={loadingStory || isLoading} emdPosNm={storyData?.story?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getStoriesDetail: { response: GetStoriesDetailResponse };
}> = ({ getUser, getStoriesDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/stories/${getStoriesDetail.response.story.id}`]: getStoriesDetail.response,
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
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

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

  // getStoriesDetail
  const { story } =
    storyId && !isNaN(+storyId)
      ? await getStoriesDetail({
          id: +storyId,
        })
      : {
          story: null,
        };
  if (!story) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // condition
  const storyCondition = getStoryCondition(story, ssrUser?.profile?.id);

  // redirect `/stories/${storyId}`
  if (storyCondition?.role?.myRole !== "author") {
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
      title: `글 수정 | ${truncateStr(story?.content, 15)} | 중고거래`,
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getStoriesDetail: {
        response: {
          success: true,
          story: JSON.parse(JSON.stringify(story || {})),
          storyCondition: JSON.parse(JSON.stringify(storyCondition || {})),
        },
      },
    },
  };
});

export default Page;
