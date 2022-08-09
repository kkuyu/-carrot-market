import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { convertPhotoToFile } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductsEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  const { data: productData, mutate } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  const formData = useForm<EditProductTypes>();
  const [photoLoading, setPhotoLoading] = useState(true);
  const [editProduct, { loading }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutate((prev) => prev && { ...prev, product: { ...prev?.product, ...data?.product } });
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

  const setDefaultPhotos = async () => {
    if (!productData?.product?.photos) {
      setPhotoLoading(false);
      return;
    }

    const transfer = new DataTransfer();
    const photos = productData?.product?.photos.length ? productData?.product.photos.split(",") : [];
    for (let index = 0; index < photos.length; index++) {
      const file = await convertPhotoToFile(photos[index]);
      if (file !== null) transfer.items.add(file);
    }

    formData.setValue("photos", transfer.files);
    setPhotoLoading(false);
  };

  const submitEditProduct = async ({ photos: _photos, ...data }: EditProductTypes) => {
    if (!user || loading || photoLoading) return;

    if (!_photos?.length) {
      editProduct({ ...data, photos: [] });
      return;
    }

    let photos = [];
    setPhotoLoading(true);
    for (let index = 0; index < _photos.length; index++) {
      try {
        // same photo
        if (productData?.product?.photos && productData?.product.photos.includes(_photos[index].name)) {
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
      } catch {
        console.error(`Failed Upload: ${_photos[index].name}`);
      }
    }
    editProduct({ photos, ...data });
  };

  useEffect(() => {
    if (!productData?.product) return;
    if (productData.product.userId !== user?.id) {
      router.push(`/products/${router.query.id}`);
      return;
    }
    setPhotoLoading(true);
    formData.setValue("category", productData?.product?.category as EditProductTypes["category"]);
    formData.setValue("name", productData?.product?.name);
    formData.setValue("description", productData?.product?.description);
    formData.setValue("price", productData?.product?.price);
    setDefaultPhotos();
  }, [productData, user?.id]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="edit-product" formData={formData} onValid={submitEditProduct} isLoading={loading || photoLoading} emdPosNm={productData?.product?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProduct: { response: GetProductsDetailResponse };
}> = ({ getUser, getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
        },
      }}
    >
      <ProductsEditPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // productId
  const productId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/products/${productId}`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // invalidUrl
  let invalidUrl = false;
  if (!productId || isNaN(+productId)) invalidUrl = true;
  // redirect `/products/${productId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProduct
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
  });

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  if (product?.userId !== ssrUser?.profile?.id) invalidProduct = true;
  // redirect `/products/${productId}`
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "글 수정 | 중고거래",
    },
    header: {
      title: "중고거래 글 수정",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "edit-product",
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
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
        },
      },
    },
  };
});

export default Page;
