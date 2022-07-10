import type { NextPage } from "next";
import { useRouter } from "next/router";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";

import { PageLayout } from "@libs/states";
import { ProductCategoryEnum } from "@api/products/types";
import { GetProductDetailResponse } from "@api/products/[id]";
import { PostProductUpdateResponse } from "@api/products/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";

import ProductEdit, { ProductEditTypes } from "@components/forms/productEdit";

const Upload: NextPage<{
  staticProps: {
    product: GetProductDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [photoLoading, setPhotoLoading] = useState(false);

  const formData = useForm<ProductEditTypes>();
  const [updateProduct, { loading, data }] = useMutation<PostProductUpdateResponse>(`/api/products/${router.query.id}/update`, {
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

  const setDefaultValue = async () => {
    if (!staticProps?.product) return;

    const transfer = new DataTransfer();
    const photos = staticProps?.product?.photo ? staticProps.product.photo.split(",") : [];
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      transfer.items.add(file);
    }

    const { setValue } = formData;
    setValue("category", staticProps.product.category as ProductCategoryEnum);
    setValue("name", staticProps.product.name);
    setValue("description", staticProps.product.description);
    setValue("photos", transfer.files);
    setValue("price", staticProps.product.price);
  };

  const submitProductUpload = async ({ photos, ...data }: ProductEditTypes) => {
    if (loading || photoLoading) return;

    if (!photos || !photos.length) {
      updateProduct({
        ...data,
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

    updateProduct({
      photo: photo.join(","),
      ...data,
    });
  };

  useEffect(() => {
    setDefaultValue();

    setLayout(() => ({
      title: "중고거래 글 수정하기",
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

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const profile = req?.session?.user?.id
    ? await client.user.findUnique({
        where: { id: req?.session?.user?.id },
      })
    : null;
  const dummyProfile = !profile ? req?.session?.dummyUser : null;

  if (!profile || dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/join?addrNm=${req?.session?.dummyUser?.MAIN_emdAddrNm}`,
      },
    };
  }

  const productId = params?.id?.toString();

  // invalid params: productId
  if (!productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // find product
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
  });

  // invalid product: not found
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // invalid product: not my product
  if (product.userId !== profile.id) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
    },
  };
});

export default Upload;
