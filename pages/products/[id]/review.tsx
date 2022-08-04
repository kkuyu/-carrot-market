import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
import client from "@libs/server/client";
// @api
import { PostReviewsResponse } from "@api/reviews";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
// @components
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";
import ReviewProduct, { ReviewProductTypes } from "@components/forms/reviewProduct";

const ProductReview: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  const role = user?.id === productData?.product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = productData?.product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = productData?.product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existsReview = productData?.product?.reviews.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const { data: sellUser } = useSWR<GetProfilesDetailResponse>(productData ? `/api/users/profiles/${role === "sellUser" ? user?.id : productData?.product?.userId}` : null);
  const { data: purchaseUser } = useSWR<GetProfilesDetailResponse>(productData ? `/api/users/profiles/${role === "sellUser" ? purchaseRecord?.userId : user?.id}` : null);

  const formData = useForm<ReviewProductTypes>();
  const [uploadReview, { loading }] = useMutation<PostReviewsResponse>("/api/reviews", {
    onSuccess: (data) => {
      router.replace(`/reviews/${data.review?.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitReviewProduct = (data: ReviewProductTypes) => {
    if (loading) return;
    uploadReview({
      ...data,
      purchaseUserId: purchaseUser?.profile?.id,
      sellUserId: sellUser?.profile?.id,
      productId: productData?.product?.id,
    });
  };

  useEffect(() => {
    if (!role) return;
    formData.setValue("role", role);
  }, [role]);

  useEffect(() => {
    if (saleRecord) router.replace(`/reviews/${productData?.product?.id}`);
    if (!purchaseRecord) router.replace(`/products/${productData?.product?.id}/purchase`);
    if (purchaseRecord && existsReview) router.replace(`/reviews/${existsReview.id}`);
  }, [saleRecord, purchaseRecord, existsReview]);

  useEffect(() => {
    setLayout(() => ({
      title: "거래 후기 보내기",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  if (!productData?.product) {
    return null;
  }

  return (
    <div className="container pb-5">
      {/* 제품정보 */}
      <div className="block -mx-5 px-5 py-3 bg-gray-200">
        <Link href={`/products/${productData?.product?.id}`}>
          <a className="">
            <ProductSummary item={productData?.product} />
          </a>
        </Link>
        {role === "sellUser" && !productData?.product?.reviews.length && (
          <div className="mt-2">
            <Link href={`/products/${productData?.product?.id}/purchase`} passHref>
              <Buttons tag="a" status="default" size="sm" text="구매자 변경하기" className="!inline-block !w-auto" />
            </Link>
          </div>
        )}
      </div>

      {/* 안내 */}
      <div className="mt-5">
        {role === "sellUser" ? (
          <strong className="text-lg">
            {`${sellUser?.profile?.name}님,`}
            <br />
            {`${purchaseUser?.profile?.name}님과 거래가 어떠셨나요?`}
          </strong>
        ) : role === "purchaseUser" ? (
          <strong className="text-lg">
            {`${purchaseUser?.profile?.name}님,`}
            <br />
            {`${sellUser?.profile?.name}님과 거래가 어떠셨나요?`}
          </strong>
        ) : null}
        <p className="mt-2">거래 선호도는 나만 볼 수 있어요</p>
      </div>

      {/* 리뷰 */}
      <div className="mt-5">
        <ReviewProduct formData={formData} onValid={submitReviewProduct} />
      </div>
    </div>
  );
};

const Page: NextPage<{
  getProduct: { response: GetProductsDetailResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getOtherProfile: { response: GetProfilesDetailResponse };
}> = ({ getProduct, getProfile, getOtherProfile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
          [`/api/users/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [`/api/users/profiles/${getOtherProfile.response.profile.id}`]: getOtherProfile.response,
        },
      }}
    >
      <ProductReview />
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

  const productId = params?.id?.toString();

  // !ssrUser.profile
  // invalid params: productId
  // redirect: /products/[id]
  if (!ssrUser.profile || !productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // find product
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
    include: {
      records: {
        where: {
          OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductPurchase }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      reviews: {
        select: {
          id: true,
          role: true,
          sellUserId: true,
          purchaseUserId: true,
        },
      },
    },
  });

  // invalid product: not found
  // redirect: /products/[id]
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const role = ssrUser?.profile?.id === product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product.records.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = product.records.find((record) => record.kind === Kind.ProductPurchase);
  const existsReview = product.reviews.find((review) => review.role === role && review[`${role}Id`] === ssrUser?.profile?.id);

  // invalid product: not my product
  // redirect: /products/id
  if (ssrUser?.profile?.id !== product.userId && ssrUser?.profile?.id !== purchaseRecord?.userId) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // sale product
  // redirect: /products/id
  if (saleRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}`,
      },
    };
  }

  // not purchase product
  // redirect: /products/id/purchase
  if (!purchaseRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}/purchase`,
      },
    };
  }

  // exists review
  // redirect: /reviews/id
  if (purchaseRecord && existsReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${existsReview.id}`,
      },
    };
  }

  // other user
  const findUser = await client.user.findUnique({
    where: {
      id: role === "sellUser" ? purchaseRecord.userId : product.userId,
    },
  });

  return {
    props: {
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || [])),
        },
      },
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
        },
      },
      getOtherProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(findUser || {})),
        },
      },
    },
  };
});

export default Page;
