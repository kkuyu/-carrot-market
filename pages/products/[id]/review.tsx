import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProfilesDetailResponse, getProfilesDetail } from "@api/profiles/[id]";
import { PostProductsDetailReviewResponse } from "@api/products/[id]/review";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";
import EditProductReview, { EditProductReviewTypes } from "@components/forms/editProductReview";

const ProductsReviewPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: invisible
  const [isValidProduct, setIsValidProduct] = useState(true);

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(productData ? `/api/profiles/${productData?.productCondition?.role?.partnerUserId}` : null);

  // mutation data
  const [uploadReview, { loading: loadingReview }] = useMutation<PostProductsDetailReviewResponse>("/api/products/[id]/review", {
    onSuccess: async (data) => {
      router.replace(`/products/reviews/${data?.review?.id}`);
    },
  });

  // variable: visible
  const formData = useForm<EditProductReviewTypes>({
    defaultValues: {
      id: productData?.product?.id,
      role: productData?.productCondition?.role?.myRole as "sellUser" | "purchaseUser",
      sellUserId: productData?.productCondition?.role?.myRole === "sellUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!,
      purchaseUserId: productData?.productCondition?.role?.myRole === "purchaseUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!,
    },
  });

  // update: Review
  const submitReview = (data: EditProductReviewTypes) => {
    if (!user || loadingReview) return;
    uploadReview({ ...data });
  };

  // update: isValidProduct
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "purchaseUser"),
      product: productData?.productCondition?.isSale,
      purchase: !productData?.productCondition?.isPurchase,
      sentReview: Boolean(productData?.productCondition?.review?.sentReviewId),
      profile: !profileData?.profile,
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      if (!redirectDestination && isInvalid.purchase) redirectDestination = `/products/${productId}/purchase/available`;
      if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/products/reviews/${productData?.productCondition?.review?.sentReviewId}`;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
  }, [productData]);

  // update: formData
  useEffect(() => {
    if (!productData?.product) return;
    formData.setValue("id", productData?.product?.id);
    formData.setValue("role", productData?.productCondition?.role?.myRole as "sellUser" | "purchaseUser");
    formData.setValue("sellUserId", productData?.productCondition?.role?.myRole === "sellUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
    formData.setValue("purchaseUserId", productData?.productCondition?.role?.myRole === "purchaseUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
  }, [productData?.product]);

  if (!isValidProduct) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <div className="px-5 py-3 bg-gray-200">
          <Link href={`/products/${productData?.product?.id}`}>
            <a className="block">
              <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
            </a>
          </Link>
          <div className="empty:hidden mt-2">
            {productData?.productCondition?.role?.myRole === "sellUser" && !productData?.product?.reviews?.length && (
              <Link href={`/products/${productData?.product?.id}/purchase/available`} passHref>
                <Buttons tag="a" status="default" size="sm" className="!inline-block !w-auto">
                  구매자 변경하기
                </Buttons>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 리뷰작성 */}
      {profileData?.profile && (
        <div className="container pt-5 pb-5">
          {/* 안내 */}
          <strong className="text-lg">
            {user?.name}님,
            <br />
            {profileData?.profile?.name ? `${profileData?.profile?.name}님과 거래가 어떠셨나요?` : `거래가 어떠셨나요?`}
          </strong>
          <p className="mt-2">거래 선호도는 나만 볼 수 있어요</p>

          {/* 리뷰 */}
          <div className="mt-5">
            <EditProductReview formData={formData} onValid={submitReview} />
          </div>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
  getProfilesDetail: { response: GetProfilesDetailResponse };
}> = ({ getUser, getProductsDetail, getProfilesDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
          [`/api/profiles/${getProfilesDetail.response.profile.id}`]: getProfilesDetail.response,
        },
      }}
    >
      <ProductsReviewPage />
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
  // redirect: `/products/${productId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const { product, productCondition } =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProfilesDetail
  const { profile } = productCondition?.role?.partnerUserId
    ? await getProfilesDetail({
        id: productCondition?.role?.partnerUserId,
      })
    : {
        profile: null,
      };

  const isInvalid = {
    user: !(productCondition?.role?.myRole === "sellUser" || productCondition?.role?.myRole === "purchaseUser"),
    product: productCondition?.isSale,
    purchase: !productCondition?.isPurchase,
    sentReview: Boolean(productCondition?.review?.sentReviewId),
    profile: !profile,
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    if (!redirectDestination && isInvalid.purchase) redirectDestination = `/products/${productId}/purchase/available`;
    if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/products/reviews/${productCondition?.review?.sentReviewId}`;
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
      title: `거래 후기 보내기 | ${truncateStr(product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "거래 후기 보내기",
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsDetail: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
      getProfilesDetail: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
    },
  };
});

export default Page;
