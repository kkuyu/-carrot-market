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
import client from "@libs/server/client";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { PostReviewsResponse } from "@api/reviews";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";
import EditReview, { EditReviewTypes } from "@components/forms/editReview";

const ProductsReviewPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: invisible
  const [isValidProduct, setIsValidProduct] = useState(true);

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);
  const { data: partnerProfileData } = useSWR<GetProfilesDetailResponse>(productData ? `/api/profiles/${productData?.productCondition?.role?.partnerUserId}` : null);

  // mutation data
  const [uploadReview, { loading: loadingReview }] = useMutation<PostReviewsResponse>("/api/reviews", {
    onSuccess: async (data) => {
      router.replace(`/reviews/${data.review?.id}`);
    },
  });

  // variable: visible
  const formData = useForm<EditReviewTypes>({
    defaultValues: {
      role: productData?.productCondition?.role?.myRole as "sellUser" | "purchaseUser",
      productId: productData?.product?.id,
      sellUserId: productData?.productCondition?.role?.myRole === "sellUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!,
      purchaseUserId: productData?.productCondition?.role?.myRole === "purchaseUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!,
    },
  });

  // update: ProductReview
  const submitReview = (data: EditReviewTypes) => {
    if (!user || loadingReview) return;
    uploadReview({ ...data });
  };

  // update: formData, isValidProduct
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "purchaseUser"),
      product: productData?.productCondition?.isSale,
      purchase: !productData?.productCondition?.isPurchase,
      sentReview: productData?.productCondition?.isPurchase && productData?.productCondition?.review?.sentReviewId,
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      if (!redirectDestination && isInvalid.purchase) redirectDestination = `/products/${productId}/purchase/available`;
      if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/reviews/${productData?.productCondition?.review?.sentReviewId}`;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
    formData.setValue("productId", productData?.product?.id);
    formData.setValue("role", productData?.productCondition?.role?.myRole as "sellUser" | "purchaseUser");
    formData.setValue("sellUserId", productData?.productCondition?.role?.myRole === "sellUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
    formData.setValue("purchaseUserId", productData?.productCondition?.role?.myRole === "purchaseUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
    formData.resetField("manners");
    formData.resetField("satisfaction");
    formData.resetField("text");
  }, [productData]);

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
      {partnerProfileData?.profile && (
        <div className="container pt-5 pb-5">
          {/* 안내 */}
          <strong className="text-lg">
            {user?.name}님,
            <br />
            {partnerProfileData?.profile?.name ? `${partnerProfileData?.profile?.name}님과 거래가 어떠셨나요?` : `거래가 어떠셨나요?`}
          </strong>
          <p className="mt-2">거래 선호도는 나만 볼 수 있어요</p>

          {/* 리뷰 */}
          <div className="mt-5">
            <EditReview formData={formData} onValid={submitReview} />
          </div>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
  getPartnerProfile: { response: GetProfilesDetailResponse };
}> = ({ getUser, getProductsDetail, getPartnerProfile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
          [`/api/profiles/${getPartnerProfile.response.profile.id}`]: getPartnerProfile.response,
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

  const isInvalid = {
    user: !(productCondition?.role?.myRole === "sellUser" || productCondition?.role?.myRole === "purchaseUser"),
    product: productCondition?.isSale,
    purchase: !productCondition?.isPurchase,
    sentReview: productCondition?.isPurchase && productCondition?.review?.sentReviewId,
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    if (!redirectDestination && isInvalid.purchase) redirectDestination = `/products/${productId}/purchase/available`;
    if (!redirectDestination && isInvalid.sentReview) redirectDestination = `/reviews/${productCondition?.review?.sentReviewId}`;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/products/${productId}`,
      },
    };
  }

  // getPartnerProfile
  const partnerProfile = productCondition?.role?.partnerUserId
    ? await client.user.findUnique({
        where: {
          id: productCondition?.role?.partnerUserId,
        },
      })
    : null;

  // redirect `/products/${productId}`
  if (!partnerProfile) {
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
      getPartnerProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(partnerProfile || {})),
        },
      },
    },
  };
});

export default Page;
