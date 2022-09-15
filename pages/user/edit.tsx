import type { NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { validateFiles, submitFiles } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { ProfilePhotoOptions } from "@api/profiles/types";
import { GetUserResponse, PostUserResponse, getUser } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditProfile, { EditProfileTypes } from "@components/forms/editProfile";

const UserEditPage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType, mutate: mutateUser } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);

  // mutation data
  const [updateUser, { loading: loadingUser }] = useMutation<PostUserResponse | PostDummyResponse>(userType === "member" ? "/api/user" : "/api/user/dummy", {
    onSuccess: async () => {
      await mutateUser();
      await router.replace(`/user`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: visible
  const formData = useForm<EditProfileTypes>({
    defaultValues: {
      originalPhotoPaths: user?.photos,
      name: user?.name,
      concerns: !user?.concerns ? [] : user?.concerns?.map((concern) => concern.value),
    },
  });

  // update: User
  const submitUser = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditProfileTypes) => {
    if (!user || loadingUser || isLoading) return;
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, ProfilePhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    updateUser({ ...data, photos: validPaths });
  };

  useEffect(() => {
    if (!user) return;
    formData.setValue("originalPhotoPaths", user?.photos);
    formData.setValue("name", user?.name);
    formData.setValue("concerns", !user?.concerns ? [] : user?.concerns?.map((concern) => concern.value));
  }, [user]);

  if (!user) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="container pt-5 pb-5">
      <EditProfile formId="edit-profile" formData={formData} onValid={submitUser} isLoading={loadingUser || isLoading} userType={userType} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
        },
      }}
    >
      <UserEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "프로필 수정 | 나의 당근",
    },
    header: {
      title: "프로필 수정",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "edit-profile",
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
    },
  };
});

export default Page;
