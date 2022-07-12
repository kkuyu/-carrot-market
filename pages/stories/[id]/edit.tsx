import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetStoriesDetailResponse } from "@api/stories/[id]";
import { PostStoriesUpdateResponse } from "@api/stories/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @components
import EditStory, { EditStoryTypes } from "@components/forms/editStory";

const StoryUpload: NextPage<{
  staticProps: {
    story: GetStoriesDetailResponse["story"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);

  const formData = useForm<EditStoryTypes>({
    defaultValues: {
      category: staticProps.story.category as EditStoryTypes["category"],
      content: staticProps.story.content,
    },
  });
  const [editStory, { loading, data }] = useMutation<PostStoriesUpdateResponse>(`/api/stories/${router.query.id}/update`, {
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

  const setDefaultPhotos = async () => {
    if (!staticProps?.story || staticProps?.story?.photos) return;

    const transfer = new DataTransfer();
    const photos = staticProps.story.photos.split(",");
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
  };

  const submitUploadStory = async ({ photos: _photos, ...data }: EditStoryTypes) => {
    if (loading || photoLoading) return;

    if (!_photos || !_photos.length) {
      editStory({ ...data });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
      // same photo
      if (staticProps?.story?.photos && staticProps.story.photos.includes(_photos[index].name)) {
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

    editStory({ photos: photos.join(","), ...data });
  };

  useEffect(() => {
    setDefaultPhotos();

    setLayout(() => ({
      title: "동네생활 글 수정하기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "edit-story",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditStory formId="edit-story" formData={formData} onValid={submitUploadStory} isLoading={loading || photoLoading} emdPosNm={staticProps?.story?.emdPosNm || ""} />
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

  // redirect: join
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${ssrUser?.currentAddr?.emdAddrNm}`,
      },
    };
  }

  const storyId = params?.id?.toString();

  // invalid params: storyId
  // redirect: stories
  if (!storyId || isNaN(+storyId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories`,
      },
    };
  }

  // find story
  const story = await client.story.findUnique({
    where: {
      id: +storyId,
    },
  });

  // invalid story: not found
  // redirect: stories/[id]
  if (!story) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  // invalid story: not my story
  // redirect: stories/[id]
  if (story.userId !== ssrUser?.profile?.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/stories/${storyId}`,
      },
    };
  }

  return {
    props: {
      staticProps: {
        story: JSON.parse(JSON.stringify(story || {})),
      },
    },
  };
});

export default StoryUpload;
