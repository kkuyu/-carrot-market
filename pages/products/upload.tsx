import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";

import { PageLayout } from "@libs/states";
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import ProductEdit, { ProductEditTypes } from "@components/forms/productEdit";

const Upload: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);

  const formData = useForm<ProductEditTypes>();
  const [uploadProduct, { loading, data }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
      setPhotoLoading(false);
      router.replace(`/products/${data.product.id}`);
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

  const submitProductUpload = async ({ photos, ...data }: ProductEditTypes) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      uploadProduct({
        ...data,
        ...currentAddr,
      });
      return;
    }

    let photo = [];
    setPhotoLoading(true);

    for (let index = 0; index < photos.length; index++) {
      const form = new FormData();
      form.append("file", photos[index], `${user?.id}-${index}-${photos[index].name}`);

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

      photo.push(imageResponse.result.id);
    }

    uploadProduct({
      photo: photo.join(","),
      ...data,
      ...currentAddr,
    });
  };

  useEffect(() => {
    setLayout(() => ({
      title: "중고거래 글쓰기",
      header: {
        headerUtils: ["back", "title", "submit"],
        submitId: "product-upload",
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <ProductEdit formId="product-upload" formData={formData} onValid={submitProductUpload} isLoading={loading || photoLoading} />
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

export default Upload;
