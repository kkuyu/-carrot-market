import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getReviewManners } from "@libs/utils";
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetReviewsDetailResponse } from "@api/reviews/[id]";
// @components
import Buttons from "@components/buttons";

const ReviewsDetail: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  // fetch data: chat detail
  const { data, error } = useSWR<GetReviewsDetailResponse>(router.query.id ? `/api/reviews/${router.query.id}` : null);
  const role = user?.id === data?.review?.product?.userId ? "sellUser" : "purchaseUser";
  const profile = role === "sellUser" ? data?.review?.sellUser : data?.review?.purchaseUser;
  const senderProfile = role === "sellUser" ? data?.review?.purchaseUser : data?.review?.sellUser;

  useEffect(() => {
    setLayout(() => ({
      title: `${data?.review?.role === role ? "보낸" : "받은"} 거래 후기`,
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [data?.review?.role]);

  if (!data) {
    return null;
  }

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
            {data.review.manners.map((manner) => (
              <li key={manner.id} className="relative pl-2.5">
                <span className="before:absolute before:top-1/2 before:left-0 before:-mt-0.5 before:w-1 before:h-1 before:bg-black before:rounded-full" />
                {getReviewManners(manner.value)?.text}
              </li>
            ))}
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

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getReview: { id: number; response: GetReviewsDetailResponse };
}> = ({ getUser, getReview }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/reviews/${getReview.id}`]: getReview.response,
        },
      }}
    >
      <ReviewsDetail />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // redirect: welcome
  if (!ssrUser.profile && !ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/welcome`,
      },
    };
  }
  // redirect: /
  if (ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  const reviewId = params?.id?.toString();

  // invalid params: reviewId
  // redirect: /users/profiles
  if (!reviewId || isNaN(+reviewId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles`,
      },
    };
  }

  // find review
  const review = await client.review.findUnique({
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

  // not found review
  // redirect: /users/profiles
  if (!review) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles`,
      },
    };
  }

  const role = ssrUser.profile?.id === review.product?.userId ? "sellUser" : "purchaseUser";

  // not my review
  // redirect: /users/profiles
  if (!(review.sellUser.id === ssrUser?.profile?.id || review.purchaseUser.id === ssrUser?.profile?.id)) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles`,
      },
    };
  }

  // dislike review
  // redirect: /users/profiles
  if (review.role !== role && review.satisfaction === "dislike") {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles`,
      },
    };
  }

  // receive dislike review (remove)
  if (review.product.reviews.length) {
    const receiveReview = review.product.reviews[0];
    if (receiveReview.role !== role && receiveReview.satisfaction === "dislike") {
      review.product.reviews = [];
    }
  }

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getReview: {
        id: review.id,
        response: {
          success: true,
          review: JSON.parse(JSON.stringify(review || [])),
        },
      },
    },
  };
});

export default Page;
