import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import { getProductCondition, truncateStr } from "@libs/utils";
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

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);
  const { data: partnerProfileData } = useSWR<GetProfilesDetailResponse>(productData ? `/api/profiles/${productData?.productCondition?.role?.partnerUserId}` : null);

  // mutation data
  const [uploadReview, { loading: loadingReview }] = useMutation<PostReviewsResponse>("/api/reviews", {
    onSuccess: (data) => {
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
    uploadReview({
      ...data,
    });
  };

  useEffect(() => {
    if (!productData?.product) return;
    if (!productData?.productCondition) return;
    formData.setValue("productId", productData?.product?.id);
    formData.setValue("role", productData?.productCondition?.role?.myRole as "sellUser" | "purchaseUser");
    formData.setValue("sellUserId", productData?.productCondition?.role?.myRole === "sellUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
    formData.setValue("purchaseUserId", productData?.productCondition?.role?.myRole === "purchaseUser" ? user?.id! : productData?.productCondition?.role?.partnerUserId!);
  }, [productData?.product, productData?.productCondition]);

  if (!productData?.product) return null;

  return (
    <div className="">
      {/* 제품정보 */}
      <div className="block px-5 py-3 bg-gray-200">
        <Link href={`/products/${productData?.product?.id}`}>
          <a className="">
            <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
          </a>
        </Link>
        {productData?.productCondition?.role?.myRole === "sellUser" && !productData?.product?.reviews?.length && (
          <div className="mt-2">
            <Link href={`/products/${productData?.product?.id}/purchase/available`} passHref>
              <Buttons tag="a" status="default" size="sm" className="!inline-block !w-auto">
                구매자 변경하기
              </Buttons>
            </Link>
          </div>
        )}
      </div>

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
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getPartnerProfile: { response: GetProfilesDetailResponse };
}> = ({ getUser, getProductsDetail, getProfile, getPartnerProfile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
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
  if (productCondition?.role?.myRole !== "sellUser" && productCondition?.role?.myRole !== "purchaseUser") {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // redirect `/products/${productId}`
  if (productCondition?.isSale) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // redirect `/products/${productId}/purchase/available`
  if (!productCondition?.isPurchase) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}/purchase/available`,
      },
    };
  }

  // redirect `/reviews/${productCondition?.review?.sentReviewId}`
  if (productCondition?.isPurchase && productCondition?.review?.sentReviewId) {
    return {
      redirect: {
        permanent: false,
        destination: `/reviews/${productCondition?.review?.sentReviewId}`,
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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
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
