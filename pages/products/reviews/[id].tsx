import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useState, useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
// @libs
import { truncateStr } from "@libs/utils";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { ProductMannerValues } from "@api/products/reviews/types";
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProductsReviewsDetailResponse, getProductsReviewsDetail } from "@api/products/reviews/[id]";
import { GetProfilesDetailResponse, getProfilesDetail } from "@api/profiles/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";

const ReviewsDetailPage: NextPage = () => {
  const router = useRouter();

  // variable: invisible
  const [isValidReview, setIsValidReview] = useState(true);

  // fetch data
  const { data: reviewData } = useSWR<GetProductsReviewsDetailResponse>(router.query.id ? `/api/products/reviews/${router.query.id}` : null);
  const { data: productData } = useSWR<GetProductsDetailResponse>(reviewData?.review?.productId ? `/api/products/${reviewData?.review?.productId}` : null);
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(productData?.productCondition?.role?.partnerUserId ? `/api/profiles/${productData?.productCondition?.role?.partnerUserId}` : null);

  // update: isValidReview
  useEffect(() => {
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "purchaseUser"),
      product: productData?.productCondition?.isSale || !productData?.productCondition?.isPurchase,
      profile: !profileData?.profile,
    };
    // invalid
    if (!reviewData?.success || !reviewData?.review || Object.values(isInvalid).includes(true)) {
      setIsValidReview(false);
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/user`);
      return;
    }
    // valid
    setIsValidReview(true);
  }, [reviewData, productData, profileData]);

  if (!isValidReview) {
    return <NextError statusCode={500} />;
  }

  return (
    <article className="container pt-5 pb-5">
      <h1 className="empty:hidden text-xl font-bold">
        {reviewData?.review?.role === productData?.productCondition?.role?.myRole ? (
          <>
            <span className="block">{profileData?.profile?.name}님에게</span>
            <span className="block">{reviewData?.review?.score && reviewData?.review?.score > 40 ? "따뜻한 후기" : "후기"}를 보냈어요</span>
          </>
        ) : (
          <>
            <span className="block">{profileData?.profile?.name}님이 보낸</span>
            <span className="block">따뜻한 후기가 도착했어요</span>
          </>
        )}
      </h1>

      <p className="empty:hidden mt-2">
        {profileData?.profile && productData?.product && (
          <span className="block">
            {profileData?.profile?.name}님과 {productData?.product?.name}를 거래했어요
          </span>
        )}
        {reviewData?.review?.score && reviewData?.review?.score <= 40 && <span className="block">작성한 내용은 상대방에게 전달되지 않으니 안심하세요</span>}
      </p>

      <div className="mt-5 p-5 border rounded-md">
        <p className="empty:hidden pb-3 whitespace-pre-wrap">{reviewData?.review?.description}</p>
        {Boolean(reviewData?.review?.manners?.length) && (
          <ul className="space-y-1">
            {reviewData?.review?.manners?.map((item) => {
              const manner = ProductMannerValues.find((manner) => manner.value === item.value);
              if (!manner) return null;
              return (
                <li key={item.id} className="relative pl-2.5">
                  <span className="before:absolute before:top-1/2 before:left-0 before:-mt-0.5 before:w-1 before:h-1 before:bg-black before:rounded-full" />
                  {manner.text}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {reviewData?.review?.role === productData?.productCondition?.role?.myRole && productData?.productCondition?.review?.receiveReviewId && (
        <Link href={`/reviews/${productData?.productCondition?.review?.receiveReviewId}`} passHref>
          <Buttons tag="a" className="mt-5">
            받은 거래 후기 보기
          </Buttons>
        </Link>
      )}

      {reviewData?.review?.role !== productData?.productCondition?.role?.myRole && productData?.productCondition?.review?.sentReviewId && (
        <Link href={`/reviews/${productData?.productCondition?.review?.sentReviewId}`} passHref>
          <Buttons tag="a" className="mt-5">
            보낸 거래 후기 보기
          </Buttons>
        </Link>
      )}

      {reviewData?.review?.role !== productData?.productCondition?.role?.myRole && !productData?.productCondition?.review?.sentReviewId && (
        <Link href={`/products/${productData?.product?.id}/review`} passHref>
          <Buttons tag="a" className="mt-5">
            거래 후기 보내기
          </Buttons>
        </Link>
      )}
    </article>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
  getProfilesDetail: { response: GetProfilesDetailResponse };
  getProductsReviewsDetail: { response: GetProductsReviewsDetailResponse };
}> = ({ getUser, getProductsDetail, getProfilesDetail, getProductsReviewsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
          [`/api/profiles/${getProfilesDetail.response.profile.id}`]: getProfilesDetail.response,
          [`/api/reviews/${getProductsReviewsDetail.response.review.id}`]: getProductsReviewsDetail.response,
        },
      }}
    >
      <ReviewsDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // reviewId
  const reviewId: string = params?.id?.toString() || "";

  // invalidUser
  // redirect `/user`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // getProductsReviewsDetail
  const { review } =
    reviewId && !isNaN(+reviewId)
      ? await getProductsReviewsDetail({
          id: +reviewId,
          userId: ssrUser?.profile?.id,
        })
      : {
          review: null,
        };
  if (!review) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // getProductsDetail
  const { product, productCondition } = review?.productId
    ? await getProductsDetail({
        id: review?.productId,
        userId: ssrUser?.profile?.id,
      })
    : {
        product: null,
        productCondition: null,
      };

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
    product: productCondition?.isSale || !productCondition?.isPurchase,
    profile: !profile,
  };

  // isInvalid
  // redirect: redirectDestination ?? `/user`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/user`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${review.role === productCondition?.role?.myRole ? "보낸" : "받은"} 거래 후기 | ${truncateStr(product?.name, 15)} | 중고거래`,
    },
    header: {
      title: `${review.role === productCondition?.role?.myRole ? "보낸" : "받은"} 거래 후기`,
      titleTag: "strong",
      utils: ["back", "title", "home"],
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
      getProductsReviewsDetail: {
        response: {
          success: true,
          review: JSON.parse(JSON.stringify(review || {})),
        },
      },
    },
  };
});

export default Page;
