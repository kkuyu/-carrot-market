import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getDiffTimeStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
// @components
import Buttons from "@components/buttons";
import Product from "@components/cards/product";
import ResumeProduct, { ResumeProductTypes } from "@components/forms/resumeProduct";

const ProductResume: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [state, setState] = useState<"HoldOff" | "MaxCount" | "ReadyFreeProduct" | "ReadyPayProduct" | null>(null);

  const today = new Date();
  const targetDate = (() => {
    let target: Date | null = null;
    let nextTarget: Date | null = null;
    if (staticProps.product.resumeCount < 15) {
      target = new Date(staticProps.product.resumeAt);
      target.setDate(target.getDate() + (2 + staticProps.product.resumeCount));
    }
    if (target && staticProps.product.resumeCount + 1 < 15) {
      nextTarget = new Date(target);
      nextTarget.setDate(nextTarget.getDate() + (2 + staticProps.product.resumeCount));
    }
    return [target, nextTarget];
  })();
  const diffTime = (() => {
    const target = !targetDate[0] ? "" : getDiffTimeStr(today.getTime(), targetDate[0].getTime(), { suffixStr: " 후" });
    const nextTarget = !targetDate[1] ? "" : getDiffTimeStr(today.getTime(), targetDate[1].getTime() + 1000 * 60 * 60 * 24, { suffixStr: " 후" });
    return [target, nextTarget];
  })();

  const formData = useForm<ResumeProductTypes>({
    defaultValues: {
      price: staticProps.product.price,
    },
  });

  const [editProduct, { loading, data }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
    onSuccess: (data) => {
      router.replace(`/users/profiles/${data.product.userId}/products`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const submitResumeProduct = () => {
    if (loading) return;
    editProduct({
      resume: true,
      price: formData.getValues("price"),
    });
  };

  useEffect(() => {
    if (targetDate[0] === null) {
      setState("MaxCount");
      return;
    }

    if (today > targetDate[0]) setState(staticProps.product.price === 0 ? "ReadyFreeProduct" : "ReadyPayProduct");
    if (today < targetDate[0]) setState("HoldOff");

    setLayout(() => ({
      title: "끌어올리기",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  if (state === null) {
    return null;
  }

  return (
    <div className="container pb-5">
      {/* 제품정보 */}
      <Link href={`/products/${staticProps.product.id}`}>
        <a className="block -mx-5 px-5 py-3 bg-gray-200">
          <Product item={staticProps.product} size="tiny" />
        </a>
      </Link>

      {/* 끌어올리기: HoldOff */}
      {state === "HoldOff" && (
        <div className="mt-5">
          <strong className="text-lg">
            <span className="text-orange-500">{diffTime[0]}에</span>
            <br />
            끌어올릴 수 있어요
          </strong>
          <p className="mt-5">
            {user?.name}님, 혹시 판매가 잘 안되시나요?
            <br />
            판매 꿀팁을 확인하고 판매 확률을 높여보세요.
            <br />
            <br />
            {/* todo: 판매 확률 높이는 꿀팁보기 */}
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" text="판매 확률 높이는 꿀팁보기" status="default" className="pl-0" />
            </Link>
          </p>
          <Buttons type="button" text="끌어올리기" className="mt-5" disabled={true} />
        </div>
      )}

      {/* 끌어올리기: MaxCount */}
      {state === "MaxCount" && (
        <div className="mt-5">
          <strong className="text-lg">
            <span className="text-orange-500">게시글당 최대 15번</span> 끌어올릴 수 있어요
            <br />
            이 게시글은 이미 15번을 모두 사용해서
            <br />
            더이상 끌어올릴 수 없어요
          </strong>
          <p className="mt-5">
            {user?.name}님, 혹시 판매가 잘 안되시나요?
            <br />
            판매 꿀팁을 확인하고 판매 확률을 높여보세요.
            <br />
            <br />
            {/* todo: 판매 확률 높이는 꿀팁보기 */}
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" text="판매 확률 높이는 꿀팁보기" status="default" className="pl-0" />
            </Link>
          </p>
          <Buttons type="button" text="끌어올리기" className="mt-5" disabled={true} />
        </div>
      )}

      {/* 끌어올리기: ReadyFreeProduct */}
      {state === "ReadyFreeProduct" && (
        <div className="mt-5">
          <strong className="text-lg">지금 끌어올리시겠어요?</strong>
          {targetDate[1] && (
            <p className="mt-5">
              다음 끌어올리기는 <span className="text-orange-500">{diffTime[1]}</span>에 할 수 있어요
            </p>
          )}
          <Buttons type="submit" text="끌어올리기" className="mt-5" disabled={loading} onClick={submitResumeProduct} />
        </div>
      )}

      {/* 끌어올리기: ReadyPayProduct */}
      {state === "ReadyPayProduct" && (
        <div className="mt-5">
          <strong className="text-lg">
            {user?.name}님, 끌어올리기 전에
            <br />
            가격을 낮춰보세요
          </strong>
          <div className="mt-5">
            <ResumeProduct formData={formData} onValid={submitResumeProduct} isLoading={loading} originalPrice={staticProps.product.price} targetDate={targetDate} diffTime={diffTime} />
          </div>
        </div>
      )}
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
          OR: [{ kind: Kind.Sale }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
    },
  });

  // invalid product: not found
  if (!product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const saleRecord = product.records.find((record) => record.kind === Kind.Sale);

  // invalid product: not my product
  // redirect: /products/id
  if (product.userId !== ssrUser?.profile?.id || ssrUser.dummyProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // sale product
  if (!saleRecord) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${product.id}`,
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
