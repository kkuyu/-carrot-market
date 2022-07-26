import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
import client from "@libs/server/client";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsDeleteResponse } from "@api/products/[id]/delete";
// @components
import Buttons from "@components/buttons";
import Product from "@components/cards/product";

const ProductDelete: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const foundChat = staticProps.product?.chats?.filter((chat) => chat._count.chatMessages > 0);
  const foundReview = staticProps.product.reviews;

  const [deleteProduct, { loading: deleteLoading }] = useMutation<PostProductsDeleteResponse>(`/api/products/${router.query.id}/delete`, {
    onSuccess: (data) => {
      router.replace(`/users/profiles/${staticProps.product.userId}/products`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const clickDelete = () => {
    if (deleteLoading) return;
    deleteProduct({});
  };

  useEffect(() => {
    setLayout(() => ({
      title: "중고거래 글 삭제",
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
      </div>

      <div className="mt-5">
        <strong className="text-lg">게시글을 정말 삭제하시겠어요?</strong>
        <ul className="mt-2 space-y-1">
          <li className="text-notice">
            <span>대화중인 채팅방이 삭제돼요.</span>
            <div className="mt-1 space-x-2">
              {Boolean(foundChat.length) && (
                <Link href={`/products/${router.query.id}/chats`} passHref>
                  <Buttons tag="a" sort="round-box" size="sm" status="default" text="채팅방으로 이동" className="!inline-block !w-auto" />
                </Link>
              )}
            </div>
          </li>
          <li className="text-notice">
            <span>서로 주고받은 거래후기가 취소돼요</span>
            <div className="mt-1 space-x-2">
              {Boolean(foundReview.length) &&
                foundReview.map((review) => (
                  <Link key={review.id} href={`/reviews/${review.id}`} passHref>
                    <Buttons
                      tag="a"
                      sort="round-box"
                      size="sm"
                      status="default"
                      text={review.role === "sellUser" ? "보낸 후기로 이동" : review.role === "purchaseUser" ? "받은 후기로 이동" : ""}
                      className="!inline-block !w-auto"
                    />
                  </Link>
                ))}
            </div>
          </li>
        </ul>
      </div>

      <Buttons type="button" text="삭제하기" className="mt-5" disabled={false} onClick={clickDelete} />
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
          OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductPurchase }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
      chats: {
        include: {
          _count: {
            select: {
              chatMessages: true,
            },
          },
        },
      },
      reviews: {
        where: {
          OR: [{ role: "sellUser" }, { role: "purchaseUser", NOT: { satisfaction: "dislike" } }],
        },
      },
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

  // invalid product: not my product
  // redirect: /products/id
  if (ssrUser?.profile?.id !== product.userId) {
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

  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
    },
  };
});

export default ProductDelete;
