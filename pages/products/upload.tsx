import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { PostProductsResponse } from "@api/products";
import { GetFileResponse, ImageDeliveryResponse } from "@api/files";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductsUploadPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { changeLayout } = useLayouts();

  const formData = useForm<EditProductTypes>();

  const [photoLoading, setPhotoLoading] = useState(false);
  const [uploadProduct, { loading }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: (data) => {
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

  const submitUploadProduct = async ({ photos: _photos, ...data }: EditProductTypes) => {
    if (loading || photoLoading) return;
    if (!_photos?.length) {
      uploadProduct({ ...data, photos: [], ...currentAddr });
      return;
    }

    let photos = [];
    setPhotoLoading(true);

    for (let index = 0; index < _photos.length; index++) {
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

    uploadProduct({ ...data, photos, ...currentAddr });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="upload-product" formData={formData} onValid={submitUploadProduct} isLoading={loading || photoLoading} emdPosNm={currentAddr?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  return <ProductsUploadPage />;
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "글 쓰기 | 중고거래",
    },
    header: {
      title: "중고거래 글 쓰기",
      titleTag: "h1",
      utils: ["back", "title", "submit"],
      submitId: "upload-product",
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
    },
  };
});

export default Page;
