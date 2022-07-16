import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
// @components
import Buttons from "@components/buttons";
import Product from "@components/cards/product";

const ProductResume: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const today = new Date();

  useEffect(() => {
    setLayout(() => ({
      title: "구매자 선택",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pt-5 pb-5">
      {/* 제품정보 */}
      <Product item={staticProps.product} size="tiny" />

      <div className="mt-5 pt-5 border-t">
        <strong className="text-lg">
          판매 완료되었어요.
          <br />
          구매자를 선택해주세요.
        </strong>

        {/* todo: 구매자선택, 후기 작성 */}
        <div className="mt-5">구매자 목록</div>

        <Link href={`/products/${router.query.id}`} passHref>
          <Buttons tag="a" text="나중에 할게요" className="mt-5" />
        </Link>
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
  });

  // invalid product: not found
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
      },
    };
  }

  // invalid product: not my product
  if (product.userId !== ssrUser?.profile?.id) {
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

export default ProductResume;
