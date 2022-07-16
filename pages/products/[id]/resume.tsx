import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
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
import Inputs from "@components/inputs";
import Labels from "@components/labels";
import Product from "@components/cards/product";

interface ResumeProductTypes {
  price: number;
}

const ProductResume: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();

  const [state, setState] = useState<"HoldOff" | "MaxCount" | "ReadyFreeProduct" | "ReadyPayProduct" | null>(null);
  const discounts = staticProps.product.price > 10000 ? ["5%", "10%", "15%"] : staticProps.product.price >= 4000 ? ["1000원", "2000원", "3000원"] : [];

  const today = new Date();
  const targetDate = (() => {
    const date = new Date(staticProps.product.resumeAt);
    date.setDate(date.getDate() + (2 + staticProps.product.resumeCount));
    return staticProps.product.resumeCount > 15 ? null : date;
  })();
  const nextTargetDate = (() => {
    if (!targetDate) return null;
    if (staticProps.product.resumeCount + 1 > 15) null;
    const date = new Date(targetDate);
    date.setDate(date.getDate() + (2 + staticProps.product.resumeCount));
    return date;
  })();
  const diffTime = (() => {
    const target = !targetDate ? "" : getDiffTimeStr(today.getTime(), targetDate.getTime(), " 후");
    const nextTarget = !nextTargetDate ? "" : getDiffTimeStr(today.getTime(), nextTargetDate.getTime() + 1000 * 60 * 60 * 24, " 후");
    return [target, nextTarget];
  })();

  const { register, handleSubmit, formState, getValues, setValue } = useForm<ResumeProductTypes>({
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

  const discountPrice = (discount: string) => {
    if (/%$/.test(discount)) setValue("price", staticProps.product.price - staticProps.product.price * (parseInt(discount) / 100));
    if (/원$/.test(discount)) setValue("price", staticProps.product.price - parseInt(discount));
  };

  const submitResumeProduct = () => {
    if (loading) return;
    editProduct({
      resume: true,
      price: getValues("price"),
    });
  };

  useEffect(() => {
    if (targetDate === null) {
      setState("MaxCount");
      return;
    }

    if (today > targetDate) setState(staticProps.product.price === 0 ? "ReadyFreeProduct" : "ReadyPayProduct");
    if (today < targetDate) setState("HoldOff");

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
    <div className="container pt-5 pb-5">
      {/* 제품정보 */}
      <Product item={staticProps.product} size="tiny" />

      {/* 끌어올리기: HoldOff */}
      {state === "HoldOff" && (
        <div className="mt-5 pt-5 border-t">
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
        <div className="mt-5 pt-5 border-t">
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
        <div className="mt-5 pt-5 border-t">
          <strong className="text-lg">지금 끌어올리시겠어요?</strong>
          {nextTargetDate && (
            <p className="mt-5">
              다음 끌어올리기는 <span className="text-orange-500">{diffTime[1]}</span>에 할 수 있어요
            </p>
          )}
          <Buttons type="submit" text="끌어올리기" className="mt-5" disabled={loading} onClick={submitResumeProduct} />
        </div>
      )}

      {/* 끌어올리기: ReadyPayProduct */}
      {state === "ReadyPayProduct" && (
        <div className="mt-5 pt-5 border-t">
          <strong className="text-lg">
            {user?.name}님, 끌어올리기 전에
            <br />
            가격을 낮춰보세요
          </strong>
          <form onSubmit={handleSubmit(submitResumeProduct)} noValidate className="mt-5 space-y-5">
            {/* 가격 */}
            <div className="space-y-1">
              <Labels text="가격" htmlFor="price" className="sr-only" />
              <Inputs
                register={register("price", {
                  required: {
                    value: true,
                    message: "가격을 입력해주세요",
                  },
                  valueAsNumber: true,
                })}
                required
                placeholder=""
                name="price"
                type="number"
                kind="price"
              />
              <span className="empty:hidden invalid">{formState.errors.price?.message}</span>
              {!Boolean(discounts.length) && (
                <div className="!mt-3">
                  <span className="text-sm text-gray-500">0원을 입력하면 나눔을 할 수 있어요</span>
                </div>
              )}
              {Boolean(discounts.length) && (
                <div className="!mt-3">
                  {discounts.map((discount) => (
                    <button type="button" key={discount} className="mr-1.5 min-w-[3.5rem] px-2.5 py-1 text-sm border border-gray-300 rounded-xl" onClick={() => discountPrice(discount)}>
                      {discount}
                    </button>
                  ))}
                  <span className="text-sm text-gray-500">할인</span>
                </div>
              )}
            </div>
            {nextTargetDate && (
              <p>
                다음 끌어올리기는 <span className="text-orange-500">{diffTime[1]}</span>에 할 수 있어요
              </p>
            )}
            <Buttons type="submit" text="끌어올리기" disabled={loading} />
          </form>
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
