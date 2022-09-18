import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
  const { currentAddr } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);

  // mutation data
  const [createStory, { loading: loadingStory }] = useMutation<PostStoriesResponse>("/api/stories", {
    onSuccess: async (data) => {
      await router.replace(`/stories/${data.story.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: form
  const formData = useForm<EditStoryTypes>({
    defaultValues: {
      emdAddrNm: currentAddr?.emdAddrNm,
      emdPosNm: currentAddr?.emdPosNm,
      emdPosX: currentAddr?.emdPosX,
      emdPosY: currentAddr?.emdPosY,
    },
  });

  // update: Product
  const submitStory = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditStoryTypes) => {
    if (loadingStory || isLoading) return;
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, StoryPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    createStory({ ...data, photos: validPaths });
  };

  // update: formData
  useEffect(() => {
    formData.setValue("emdAddrNm", currentAddr?.emdAddrNm);
    formData.setValue("emdPosNm", currentAddr?.emdPosNm);
    formData.setValue("emdPosX", currentAddr?.emdPosX);
    formData.setValue("emdPosY", currentAddr?.emdPosY);
  }, [currentAddr]);

  return (
    <div className="container pt-5 pb-5">
      <EditStory id="upload-story" formType="create" formData={formData} onValid={submitStory} isLoading={loadingStory || isLoading} />
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
