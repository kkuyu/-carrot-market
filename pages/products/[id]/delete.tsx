import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import useSWR, { mutate, SWRConfig, useSWRConfig } from "swr";
// @libs
import { submitFiles, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProfilesDetailProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsDeleteResponse } from "@api/products/[id]/delete";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";

const ProductsDeletePage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const swrConfig = useSWRConfig();

  // variable: invisible
  const [isValidProduct, setIsValidProduct] = useState(true);
  const productsCaches = Array.from(swrConfig.cache as Map<any, any>).filter(([key, value]) => /^(\$inf\$\/api\/|\/api)/.test(key) && key.includes(`/api/profiles/${user?.id}/products/all`));

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}?` : null);

  // mutation data
  const [deleteProduct, { loading: loadingProduct }] = useMutation<PostProductsDeleteResponse>(`/api/products/${router.query.id}/delete`, {
    onSuccess: async () => {
      productsCaches?.forEach(async ([key, value]) => {
        const filterProducts = (data: GetProfilesDetailProductsResponse) => data && { ...data, products: data?.products?.filter((product) => product?.id !== productData?.product?.id) };
        let updateValue = null;
        if (/^\$inf\$\/api\//.test(key)) updateValue = value.map((data: GetProfilesDetailProductsResponse) => filterProducts(data));
        if (/^\/api\//.test(key)) updateValue = filterProducts(value);
        if (updateValue) await mutate(key, updateValue);
      });
      await router.replace(`/profiles/${user?.id}/products/all`);
    },
  });

  // delete: Product
  const clickDelete = () => {
    if (loadingProduct) return;
    submitFiles([], { ...(productData?.product?.photos?.length ? { originalPaths: productData?.product?.photos?.split(";") } : {}) });
    deleteProduct({});
  };

  // update: isValidProduct
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser"),
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
  }, [productData]);

  if (!isValidProduct) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <Link href={`/products/${productData?.product?.id}`}>
          <a className="block px-5 py-3.5 bg-gray-200">
            <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
          </a>
        </Link>
      )}

      <div className="container pb-5 [&:not(:first-child)]:mt-5">
        <strong className="text-lg">게시글을 정말 삭제하시겠어요?</strong>

        <ul className="mt-3 space-y-2">
          <li className="text-notice">
            <span>대화중인 채팅방이 삭제돼요.</span>
            <div className="mt-1 space-x-2">
              {productData?.productCondition && Boolean(productData?.productCondition?.chats) && (
                <Link href={`/products/${router.query.id}/chats`} passHref>
                  <Buttons tag="a" sort="round-box" size="sm" status="default" className="inline-block w-auto">
                    채팅방 보기
                  </Buttons>
                </Link>
              )}
            </div>
          </li>
          <li className="text-notice">
            <span>서로 주고받은 거래후기가 취소돼요</span>
            <div className="mt-1 space-x-2">
              {productData?.productCondition && Boolean(productData?.productCondition?.review?.sentReviewId) && (
                <Link href={`/products/reviews/${productData?.productCondition?.review?.sentReviewId}`} passHref>
                  <Buttons tag="a" sort="round-box" size="sm" status="default" className="inline-block w-auto">
                    보낸 후기 보기
                  </Buttons>
                </Link>
              )}
              {productData?.productCondition && Boolean(productData?.productCondition?.review?.receiveReviewId) && (
                <Link href={`/products/reviews/${productData?.productCondition?.review?.receiveReviewId}`} passHref>
                  <Buttons tag="a" sort="round-box" size="sm" status="default" className="inline-block w-auto">
                    받은 후기 보기
                  </Buttons>
                </Link>
              )}
            </div>
          </li>
        </ul>

        <Buttons tag="button" type="button" onClick={clickDelete} disabled={loadingProduct} className="mt-5">
          삭제하기
        </Buttons>
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProductsDetail: { options: { url: string; query: string }; response: GetProductsDetailResponse };
}> = ({ getUser, getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProductsDetail?.options?.url}?${getProductsDetail?.options?.query}`]: getProductsDetail.response,
        },
      }}
    >
      <ProductsDeletePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const productId = params?.id?.toString() || "";

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/products/${productId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const productsDetail =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!productsDetail?.product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const isInvalid = {
    user: !(productsDetail?.productCondition?.role?.myRole === "sellUser"),
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/products/${productId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `글 삭제 | ${truncateStr(productsDetail?.product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "중고거래 글 삭제",
      titleTag: "h1",
      utils: ["back", "title"],
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
      getProductsDetail: {
        options: {
          url: `/api/products/${productId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsDetail || {})),
        },
      },
    },
  };
});

export default Page;
