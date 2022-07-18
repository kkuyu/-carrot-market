import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
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
import Product from "@components/cards/product";
import ReviewProduct, { ReviewProductTypes } from "@components/forms/reviewProduct";

const ProductReview: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
    role: "sellUser" | "purchaseUser";
    sellUser: GetProfilesDetailResponse["profile"];
    purchaseUser: GetProfilesDetailResponse["profile"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const formData = useForm<ReviewProductTypes>({
    defaultValues: {
      role: staticProps.role,
    },
  });
  const [uploadReview, { loading, data }] = useMutation<PostReviewsResponse>("/api/reviews", {
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
      inquiry: data.inquiry?.join(","),
      purchaseUserId: staticProps?.purchaseUser.id,
      sellUserId: staticProps?.sellUser.id,
      productId: staticProps.product.id,
    });
  };

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

  return (
    <div className="container pb-5">
      {/* 제품정보 */}
      <div className="block -mx-5 px-5 py-3 bg-gray-200">
        <Link href={`/products/${staticProps.product.id}`}>
          <a className="">
            <Product item={staticProps.product} size="tiny" />
          </a>
        </Link>
        {staticProps.role === "sellUser" && !staticProps.product.reviews.length && (
          <div className="mt-2">
            <Link href={`/products/${staticProps.product.id}/purchase`} passHref>
              <Buttons tag="a" status="default" size="sm" text="구매자 변경하기" className="!inline-block !w-auto" />
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5">
        {staticProps.role === "sellUser" ? (
          <strong className="text-lg">
            {`${staticProps?.sellUser?.name}님,`}
            <br />
            {`${staticProps?.purchaseUser?.name}님과 거래가 어떠셨나요?`}
          </strong>
        ) : staticProps.role === "purchaseUser" ? (
          <strong className="text-lg">
            {`${staticProps?.purchaseUser?.name}님,`}
            <br />
            {`${staticProps?.sellUser?.name}님과 거래가 어떠셨나요?`}
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

  // invalid params: productId
  if (!productId || isNaN(+productId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
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
          OR: [{ kind: Kind.Sale }, { kind: Kind.Purchase }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      reviews: true,
    },
  });

  // invalid product: not found
  // redirect: /
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const role = ssrUser?.profile?.id === product.userId ? "sellUser" : "purchaseUser";
  const saleRecord = product.records.find((record) => record.kind === Kind.Sale);
  const purchaseRecord = product.records.find((record) => record.kind === Kind.Purchase);
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
  if (ssrUser.dummyProfile) {
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
  // redirect: /products/id/review
  if (!purchaseRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}/purchase`,
      },
    };
  }

  // exists review
  // redirect: /review/id
  if (purchaseRecord && existsReview) {
    return {
      redirect: {
        permanent: false,
        destination: `/review/${existsReview.id}`,
      },
    };
  }

  // purchase user
  const findUser = await client.user.findUnique({
    where: {
      id: role === "sellUser" ? purchaseRecord.userId : product.userId,
    },
  });

  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
        role: role,
        sellUser: JSON.parse(JSON.stringify(role === "sellUser" ? ssrUser.profile : findUser || {})),
        purchaseUser: JSON.parse(JSON.stringify(role === "sellUser" ? findUser : ssrUser.profile || {})),
      },
    },
  };
});

export default ProductReview;
