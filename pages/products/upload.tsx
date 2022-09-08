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
import { ProductPhotoOptions } from "@api/products/types";
import { PostProductsResponse } from "@api/products";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductsUploadPage: NextPage = () => {
  const router = useRouter();
  const { user, currentAddr } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);

  // mutation data
  const [uploadProduct, { loading: loadingProduct }] = useMutation<PostProductsResponse>("/api/products", {
    onSuccess: async (data) => {
      router.replace(`/products/${data.product.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: visible
  const formData = useForm<EditProductTypes>();

  // update: Product
  const submitProduct = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditProductTypes) => {
    if (!user || loadingProduct || isLoading) return;
    if (!currentPhotoFiles?.length) {
      uploadProduct({ ...data, photos: [], ...currentAddr });
      return;
    }
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, ProductPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    uploadProduct({ ...data, photos: validPaths, ...currentAddr });
  };

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="upload-product" formData={formData} onValid={submitProduct} isLoading={loadingProduct || isLoading} emdPosNm={currentAddr?.emdPosNm || ""} />
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
      <ProductsUploadPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/`
  if (!ssrUser.profile) {
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
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
