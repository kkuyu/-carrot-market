import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getReviewManners } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetReviewsDetailResponse } from "@api/reviews/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";

const ReviewsDetailPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  // fetch data: chat detail
  const { data, error } = useSWR<GetReviewsDetailResponse>(router.query.id ? `/api/reviews/${router.query.id}` : null);
  const role = user?.id === data?.review?.product?.userId ? "sellUser" : "purchaseUser";
  const profile = role === "sellUser" ? data?.review?.sellUser : data?.review?.purchaseUser;
  const senderProfile = role === "sellUser" ? data?.review?.purchaseUser : data?.review?.sellUser;

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!data) return null;

  return (
    <article className="container pt-5 pb-5">
      {data?.review?.role === role && (
        <h1 className="text-xl font-bold">
          {senderProfile?.name}님에게
          <br />
          {data.review.satisfaction === "dislike" ? "후기" : "따뜻한 후기"}를 보냈어요
        </h1>
      )}
      {data?.review?.role !== role && (
        <h1 className="text-xl font-bold">
          {senderProfile?.name}님이 보낸
          <br />
          따뜻한 후기가 도착했어요
        </h1>
      )}
      <p className="mt-2">
        {data.review.satisfaction === "dislike" && <span className="block">작성한 내용은 상대방에게 전달되지 않으니 안심하세요</span>}
        {profile?.name}님과 {data.review.product.name}를 거래했어요
      </p>
      <div className="mt-5 p-5 border rounded-md">
        {data.review.text && <p className="pb-3 whitespace-pre-wrap">{data.review.text}</p>}
        {Boolean(data.review.manners.length) && (
          <ul className="space-y-1">
            {data.review.manners.map((item) => {
              const manner = getReviewManners(item.value);
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
      {Boolean(data.review.product.reviews.length) ? (
        <Link href={`/reviews/${data.review.product.reviews[0].id}`} passHref>
          <Buttons tag="a" text={`${data?.review?.role === role ? "받은" : "보낸"} 거래 후기 보기`} className="mt-5" />
        </Link>
      ) : data?.review?.role !== role ? (
        <Link href={`/products/${data.review.product.id}/review`} passHref>
          <Buttons tag="a" text="거래 후기 보내기" className="mt-5" />
        </Link>
      ) : null}
    </article>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getReview: { response: GetReviewsDetailResponse };
}> = ({ getUser, getReview }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/reviews/${getReview.response.review.id}`]: getReview.response,
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
  const ssrUser = await getSsrUser(req);

  // reviewId
  const reviewId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/user`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // invalidUrl
  let invalidUrl = false;
  if (!reviewId || isNaN(+reviewId)) invalidUrl = true;
  // redirect `/user`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // getReview
  const review = await client.productReview.findUnique({
    where: {
      id: +reviewId,
    },
    include: {
      manners: true,
      purchaseUser: {
        select: {
          id: true,
          name: true,
        },
      },
      sellUser: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          userId: true,
          reviews: {
            where: {
              NOT: [{ id: +reviewId }],
            },
            select: {
              id: true,
              role: true,
              satisfaction: true,
            },
          },
        },
      },
    },
  });

  // invalidReview
  let invalidReview = false;
  if (!review) invalidReview = true;
  // redirect `/user`
  if (invalidReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // condition
  const role = ssrUser.profile?.id === review?.product?.userId ? "sellUser" : "purchaseUser";

  // invalidCondition
  let invalidCondition = false;
  if (!(review?.sellUser.id === ssrUser?.profile?.id || review?.purchaseUser.id === ssrUser?.profile?.id)) invalidCondition = true;
  if (review?.role !== role && review?.satisfaction === "dislike") invalidCondition = true;
  // redirect `/user`
  if (invalidCondition) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${review?.role === role ? "보낸" : "받은"} 거래 후기`,
    },
    header: {
      title: `${review?.role === role ? "보낸" : "받은"} 거래 후기`,
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
      getReview: {
        response: {
          success: true,
          review: JSON.parse(
            JSON.stringify(
              {
                ...review,
                product: {
                  ...review?.product,
                  reviews: review?.product?.reviews?.filter((review) => review.satisfaction !== "dislike"),
                },
              } || {}
            )
          ),
        },
      },
    },
  };
});

export default Page;
