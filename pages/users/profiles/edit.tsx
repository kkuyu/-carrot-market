import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
// @libs
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse, PostUserResponse } from "@api/users/my";
import { PostDummyResponse } from "@api/users/dummy";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import CustomHead from "@components/custom/head";
import EditProfile, { EditProfileTypes } from "@components/forms/editProfile";

const ProfileEdit: NextPage = () => {
  const router = useRouter();
  const { user, mutate: mutateUser } = useUser();
  const { changeLayout } = useLayouts();

  const formData = useForm<EditProfileTypes>();

  const [photoLoading, setPhotoLoading] = useState(true);
  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>(`/api/users/my`, {
    onSuccess: async (data) => {
      await mutateUser();
      router.replace(`/users/profiles/${user?.id}`);
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
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostDummyResponse>("/api/users/dummy", {
    onSuccess: () => {
      router.replace(`/users/profiles`);
    },
    onError: (data) => {
      setPhotoLoading(false);
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const setDefaultPhotos = async () => {
    if (!user || !user?.avatar) {
      setPhotoLoading(false);
    }

    const transfer = new DataTransfer();
    const photos = user?.avatar?.length ? user?.avatar?.split(",") : [];
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      if (file !== null) transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
    setPhotoLoading(false);
  };

  const submitProfileUpdate = async ({ photos: _photos, ...data }: EditProfileTypes) => {
    if (user?.id === -1) {
      if (updateDummyLoading || photoLoading) return;
      updateDummy({ ...data });
      return;
    }

    if (updateUserLoading || photoLoading) return;
    if (!_photos || !_photos.length) {
      updateUser({ ...data, photos: [] });
      return;
    }

    let photos = [];
    setPhotoLoading(true);
    for (let index = 0; index < _photos.length; index++) {
      // same photo
      if (user?.avatar && user.avatar.includes(_photos[index].name)) {
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

    updateUser({ ...data, photos });
  };

  useEffect(() => {
    if (!user) return;
    setPhotoLoading(true);
    formData.setValue("name", user?.name);
    formData.setValue("concerns", !user?.concerns ? [] : (user.concerns.split(",") as EditProfileTypes["concerns"]));
    setDefaultPhotos();
  }, [user?.id]);

  useEffect(() => {
    changeLayout({
      header: {
        title: "프로필 수정",
        titleTag: "h1",
        utils: ["back", "title", "submit"],
        submitId: "edit-profile",
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <CustomHead title="프로필 수정 | 나의 당근" />

      <EditProfile
        formId="edit-profile"
        formData={formData}
        onValid={submitProfileUpdate}
        isDummyProfile={user?.id === -1}
        isLoading={user?.id === -1 ? updateDummyLoading : updateUserLoading || photoLoading}
      />
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
        },
      }}
    >
      <ProfileEdit />
    </SWRConfig>
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

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
    },
  };
});

export default Page;
