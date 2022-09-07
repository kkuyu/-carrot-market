import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import useSWR, { mutate, SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
// @libs
import { getKey, getProductCondition, submitFiles, truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
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

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}` : null);

  // mutation data
  const [deleteProduct, { loading: loadingProduct }] = useMutation<PostProductsDeleteResponse>(`/api/products/${router.query.id}/delete`, {
    onSuccess: async () => {
      const options = { url: `/api/profiles/${user?.id}/products/all` };
      await mutate(unstable_serialize((...arg: [index: number, previousPageData: GetProfilesProductsResponse]) => getKey<GetProfilesProductsResponse>(...arg, options)));
      router.replace(`/profiles/${user?.id}/products/all`);
    },
  });

  // delete: Product
  const clickDelete = () => {
    if (loadingProduct) return;
    submitFiles([], { ...(productData?.product?.photos?.length ? { originalPaths: productData?.product?.photos?.split(";") } : {}) });
    deleteProduct({});
  };

  if (!productData?.product) return null;

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <div className="block px-5 py-3 bg-gray-200">
          <Link href={`/products/${productData?.product?.id}`}>
            <a className="">
              <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
            </a>
          </Link>
        </div>
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
                <Link href={`/reviews/${productData?.productCondition?.review?.sentReviewId}`} passHref>
                  <Buttons tag="a" sort="round-box" size="sm" status="default" className="inline-block w-auto">
                    보낸 후기 보기
                  </Buttons>
                </Link>
              )}
              {productData.productCondition && Boolean(productData?.productCondition?.review?.receiveReviewId) && (
                <Link href={`/reviews/${productData?.productCondition?.review?.receiveReviewId}`} passHref>
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
  getUser: { response: GetUserResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
}> = ({ getUser, getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response,
        },
      }}
    >
      <ProductsDeletePage />
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
  if (productCondition?.role?.myRole !== "sellUser") {
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
      title: `글 삭제 | ${truncateStr(product?.name, 15)} | 중고거래`,
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsDetail: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
    },
  };
});

export default Page;
