import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getProductCondition, validateFiles, submitFiles, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { ProductPhotoOptions } from "@api/products/types";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditProduct, { EditProductTypes } from "@components/forms/editProduct";

const ProductsEditPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: invisible
  const [isLoading, setIsLoading] = useState(false);

  // fetch data
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  // mutation data
  const [editProduct, { loading: loadingProduct }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
    onSuccess: async (data) => {
      await mutateProduct();
      router.replace(`/products/${data.product.id}`);
    },
    onCompleted: () => {
      setIsLoading(false);
    },
  });

  // variable: visible
  const formData = useForm<EditProductTypes>({
    defaultValues: {
      originalPhotoPaths: productData?.product?.photos,
      category: productData?.product?.category as EditProductTypes["category"],
      name: productData?.product?.name,
      description: productData?.product?.description,
      price: productData?.product?.price,
    },
  });

  // update: Product
  const submitProduct = async ({ originalPhotoPaths, currentPhotoFiles, ...data }: EditProductTypes) => {
    if (!user || loadingProduct || isLoading) return;
    setIsLoading(true);
    const { validFiles } = validateFiles(currentPhotoFiles, ProductPhotoOptions);
    const { uploadPaths: validPaths } = await submitFiles(validFiles, { ...(originalPhotoPaths?.length ? { originalPaths: originalPhotoPaths?.split(";") } : {}) });
    editProduct({ ...data, photos: validPaths });
  };

  useEffect(() => {
    if (!productData?.product) return;
    formData.setValue("originalPhotoPaths", productData?.product?.photos);
    formData.setValue("category", productData?.product?.category as EditProductTypes["category"]);
    formData.setValue("name", productData?.product?.name);
    formData.setValue("description", productData?.product?.description);
    formData.setValue("price", productData?.product?.price);
  }, [productData]);

  return (
    <div className="container pt-5 pb-5">
      <EditProduct formId="edit-product" formData={formData} onValid={submitProduct} isLoading={loadingProduct || isLoading} emdPosNm={productData?.product?.emdPosNm || ""} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
}> = ({ getUser, getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
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
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

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

  // getProductsDetail
  const { product } =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
        })
      : {
          product: null,
        };
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // condition
  const productCondition = getProductCondition(product, ssrUser?.profile?.id);

  // redirect `/products/${productId}`
  if (productCondition?.role?.myRole !== "sellUser") {
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
      title: `글 수정 | ${truncateStr(product?.name, 15)} | 중고거래`,
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
      getProductsDetail: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
    },
  };
});

export default Page;
