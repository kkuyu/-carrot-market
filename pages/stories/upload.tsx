import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
// @libs
import { validateFiles, submitFiles } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { StoryPhotoOptions } from "@api/stories/types";
import { PostStoriesResponse } from "@api/stories";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoriesUploadPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);

  // mutation data
  const [uploadStory, { loading: loadingStory }] = useMutation<PostStoriesResponse>("/api/stories", {
    onSuccess: async (data) => {
      await router.replace(`/stories/${data.story.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: visible
  const formData = useForm<EditStoryTypes>();

  // update: Product
  const submitStory = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditStoryTypes) => {
    if (!user || loadingStory || isLoading) return;
    if (!currentPhotoFiles?.length) {
      uploadStory({ ...data, photos: [], ...currentAddr });
      return;
    }
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, StoryPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    uploadStory({ ...data, photos: validPaths, ...currentAddr });
  };

  return (
    <div className="container pt-5 pb-5">
      <EditStory formId="upload-story" formData={formData} onValid={submitStory} isLoading={loadingStory || isLoading} emdPosNm={currentAddr?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
        },
      }}
    >
      <StoriesUploadPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/stories`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "글 쓰기 | 동네생활",
    },
    header: {
      title: "동네생활 글 쓰기",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "upload-story",
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
    },
  };
});

export default Page;
