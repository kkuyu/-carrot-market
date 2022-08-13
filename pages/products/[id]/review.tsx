import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
import client from "@libs/server/client";
// @api
import { GetUserResponse } from "@api/user";
import { PostReviewsResponse } from "@api/reviews";
import { GetProductsDetailResponse } from "@api/products/[id]";
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
  const { changeLayout } = useLayouts();

  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  const role = user?.id === productData?.product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = productData?.product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = productData?.product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = productData?.product?.reviews.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const { data: sellUser } = useSWR<GetProfilesDetailResponse>(productData ? `/api/profiles/${role === "sellUser" ? user?.id : productData?.product?.userId}` : null);
  const { data: purchaseUser } = useSWR<GetProfilesDetailResponse>(productData ? `/api/profiles/${role === "sellUser" ? purchaseRecord?.userId : user?.id}` : null);

  const formData = useForm<EditReviewTypes>();
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

  const submitReview = (data: EditReviewTypes) => {
    if (!user || loading) return;
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
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!productData?.product) return null;

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
        <EditReview formData={formData} onValid={submitReview} />
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProduct: { response: GetProductsDetailResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getOtherProfile: { response: GetProfilesDetailResponse };
}> = ({ getUser, getProduct, getProfile, getOtherProfile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [`/api/profiles/${getOtherProfile.response.profile.id}`]: getOtherProfile.response,
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
  const ssrUser = await getSsrUser(req);

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

  // invalidUrl
  let invalidUrl = false;
  if (!productId || isNaN(+productId)) invalidUrl = true;
  // redirect `/products/${productId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProduct
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

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  // redirect `/products/${productId}`
  if (invalidProduct) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // condition
  const role = ssrUser?.profile?.id === product?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = product?.reviews?.find((review) => review.role === role && review[`${role}Id`] === ssrUser?.profile?.id);

  // invalidCondition
  let invalidCondition = false;
  if (saleRecord) invalidCondition = true;
  if (ssrUser?.profile?.id !== product?.userId && ssrUser?.profile?.id !== purchaseRecord?.userId) invalidCondition = true;
  // redirect `/products/${productId}`
  if (invalidCondition) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // redirect `/products/${productId}/purchase`
  if (!purchaseRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}/purchase`,
      },
    };
  }

  // redirect `/reviews/${existedReview.id}`
  if (purchaseRecord && existedReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${existedReview.id}`,
      },
    };
  }

  // getOtherProfile
  const otherProfile = await client.user.findUnique({
    where: {
      id: role === "sellUser" ? purchaseRecord.userId : product?.userId,
    },
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "거래 후기 보내기 | 중고거래",
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
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
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
          profile: JSON.parse(JSON.stringify(otherProfile || {})),
        },
      },
    },
  };
});

export default Page;
