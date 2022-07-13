import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import { convertPhotoToFile } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { PostUserResponse } from "@api/users/my";
import { PostDummyResponse } from "@api/users/dummy";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import EditProfile, { EditProfileTypes } from "@components/forms/editProfile";

const ProfileEdit: NextPage<{
  staticProps: {
    profile: GetProfilesDetailResponse["profile"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const isDummyProfile = staticProps.profile.id === -1;

  const formData = useForm<EditProfileTypes>({
    defaultValues: {
      name: staticProps?.profile?.name,
      concerns: !staticProps?.profile?.concerns ? [] : (staticProps.profile.concerns.split(",") as EditProfileTypes["concerns"]),
    },
  });

  const [photoLoading, setPhotoLoading] = useState(false);
  const [updateUser, { loading: updateUserLoading, data }] = useMutation<PostUserResponse>(`/api/users/my`, {
    onSuccess: (data) => {
      router.replace(`/users/profiles`);
    },
    onError: (data) => {
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
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const setDefaultPhotos = async () => {
    if (!staticProps?.profile || !staticProps?.profile?.avatar) return;

    const transfer = new DataTransfer();
    const photos = staticProps.profile.avatar.split(",");
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
  };

  const submitProfileUpdate = async ({ photos: _photos, ...data }: EditProfileTypes) => {
    const concerns = !data?.concerns || !data?.concerns?.length ? "" : data.concerns.join(",");

    if (isDummyProfile) {
      if (updateDummyLoading || photoLoading) return;
      updateDummy({ ...data, concerns });
      return;
    }

    if (updateUserLoading || photoLoading) return;
    if (!_photos || !_photos.length) {
      updateUser({ ...data, photos: "", concerns });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
      // same photo
      if (staticProps?.profile?.avatar && staticProps.profile.avatar.includes(_photos[index].name)) {
        photos.push(_photos[index].name);
        continue;
      }
      // new photo
      const form = new FormData();
      form.append("file", _photos[index], `${staticProps.profile.id}-${index}-${_photos[index].name}`);
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

    updateUser({
      ...data,
      photos: photos.join(","),
      concerns,
    });
  };

  useEffect(() => {
    setDefaultPhotos();

    setLayout(() => ({
      title: "프로필 수정",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "edit-profile",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditProfile
        formId="edit-profile"
        formData={formData}
        onValid={submitProfileUpdate}
        isDummyProfile={isDummyProfile}
        isLoading={isDummyProfile ? updateDummyLoading : updateUserLoading || photoLoading}
      />
    </div>
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
      staticProps: {
        profile: JSON.parse(JSON.stringify(ssrUser.profile || ssrUser.dummyProfile || {})),
      },
    },
  };
});

export default ProfileEdit;
