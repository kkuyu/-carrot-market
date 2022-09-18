import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useState, useEffect } from "react";
import type { HTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import useSWR, { mutate, SWRConfig, useSWRConfig } from "swr";
// @libs
import { truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useTimeDiff from "@libs/client/useTimeDiff";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsUpdateResponse } from "@api/products/[id]/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductSummary from "@components/cards/productSummary";
import EditProductResume, { EditProductResumeTypes } from "@components/forms/editProductResume";

type ResumeState = {
  type: "HoldOff" | "MaxCount" | "ReadyFreeProduct" | "ReadyPayProduct" | "Error" | null;
  possibleDate: Date | null;
  afterDate: Date | null;
};

const ProductsResumePage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const swrConfig = useSWRConfig();

  // variable: invisible
  const [isValidProduct, setIsValidProduct] = useState(true);
  const [resumeState, setResumeState] = useState<ResumeState>({ type: null, possibleDate: null, afterDate: null });
  const productsCaches = Array.from(swrConfig.cache as Map<any, any>).filter(([key, value]) => /^(\$inf\$\/api\/|\/api)/.test(key) && key.includes(`/api/profiles/${user?.id}/products/all`));

  // fetch data
  const { data: productData } = useSWR<GetProductsDetailResponse>(router?.query?.id ? `/api/products/${router.query.id}?` : null);

  // mutation data
  const [editProduct, { loading: loadingProduct }] = useMutation<PostProductsUpdateResponse>(`/api/products/${router.query.id}/update`, {
    onSuccess: async () => {
      productsCaches?.forEach(async ([key, value]) => {
        const filterProducts = (data: GetProfilesProductsResponse) => data && { ...data, products: data?.products?.filter((product) => product?.id !== productData?.product?.id) };
        let updateValue = null;
        if (/^\$inf\$\/api\//.test(key)) updateValue = value.map((data: GetProfilesProductsResponse) => filterProducts(data));
        if (/^\/api\//.test(key)) updateValue = filterProducts(value);
        if (updateValue) await mutate(key, updateValue);
      });
      await router.replace(`/profiles/${user?.id}/products/all`);
    },
  });

  // variable: form
  const formData = useForm<EditProductResumeTypes>({
    defaultValues: {
      originalPrice: productData?.product?.price,
      currentPrice: productData?.product?.price,
    },
  });

  // variable: visible
  const { timeState: resumeTimeState } = useTimeDiff(resumeState?.possibleDate?.toString() || null, { config: { type: "presentToPast" } });
  const { timeState: nextResumeTimeState } = useTimeDiff(resumeState?.afterDate?.toString() || null, { config: { type: "presentToPast" } });

  // update: Product
  const submitProduct = ({ currentPrice, originalPrice, ...data }: EditProductResumeTypes) => {
    if (!user || loadingProduct) return;
    editProduct({
      ...data,
      resume: true,
      price: currentPrice,
    });
  };

  // update: isValidProduct, resumeState
  useEffect(() => {
    if (loadingProduct) return;
    const isInvalid = {
      user: !(productData?.productCondition?.role?.myRole === "sellUser"),
      product: !productData?.productCondition?.isSale,
    };
    // invalid
    if (!productData?.success || !productData?.product || Object.values(isInvalid).includes(true)) {
      setIsValidProduct(false);
      setResumeState(() => ({ type: "Error", possibleDate: null, afterDate: null }));
      const productId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/products/${productId}`);
      return;
    }
    // valid
    setIsValidProduct(true);
  }, [loadingProduct, productData]);

  // update: formData, resumeState
  useEffect(() => {
    if (!productData?.product) return;
    formData.setValue("originalPrice", productData?.product?.price);
    formData.setValue("currentPrice", productData?.product?.price);
    setResumeState(() => {
      const currentDate = new Date();
      const currentState: ResumeState = { type: null, possibleDate: null, afterDate: null };
      if (productData?.product?.resumeCount < 15) {
        currentState.possibleDate = new Date(productData?.product?.resumeAt);
        currentState.possibleDate.setDate(currentState.possibleDate.getDate() + (productData?.product?.resumeCount + 2));
      }
      if (productData?.product?.resumeCount + 1 <= 15 && currentState.possibleDate) {
        currentState.afterDate = currentState.possibleDate?.toLocaleDateString() > currentDate.toLocaleDateString() ? new Date(currentState.possibleDate) : new Date(currentDate);
        currentState.afterDate.setDate(currentState.afterDate.getDate() + (productData?.product?.resumeCount + 2));
      }
      if (currentState.possibleDate === null) currentState.type = "MaxCount";
      if (currentState.possibleDate && currentState.possibleDate < currentDate) currentState.type = productData?.product?.price === 0 ? "ReadyFreeProduct" : "ReadyPayProduct";
      if (currentState.possibleDate && currentState.possibleDate > currentDate) currentState.type = "HoldOff";
      return currentState;
    });
  }, [productData?.product]);

  if (!resumeState.type) return null;
  if (!isValidProduct || resumeState.type === "Error") {
    return <NextError statusCode={500} />;
  }

  const CustomGuideContent = (guideProps: {} & HTMLAttributes<HTMLDivElement>) => {
    const { className = "", ...guideRestProps } = guideProps;
    return (
      <div className={`${className}`} {...guideRestProps}>
        <p>
          혹시 판매가 잘 안되시나요?
          <br />
          판매 꿀팁을 확인하고 판매 확률을 높여보세요.
        </p>
        {/* todo: 판매 확률 높이는 꿀팁보기 */}
        <Link href="" passHref>
          <Buttons tag="a" sort="text-link" status="default" className="mt-2 pl-0">
            판매 확률 높이는 꿀팁보기
          </Buttons>
        </Link>
      </div>
    );
  };

  return (
    <div className="">
      {/* 제품정보 */}
      {productData?.product && (
        <Link href={`/products/${productData?.product?.id}`}>
          <a className="block px-5 py-3.5 bg-gray-200">
            <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
          </a>
        </Link>
      )}

      {/* 끌어올리기 폼 */}
      <div className="container pt-5 pb-5">
        {/* HoldOff */}
        {resumeState.type === "HoldOff" && (
          <>
            <strong className="text-lg">
              {user?.name}님, <span className="text-orange-500">{resumeTimeState?.diffStr}에</span>
              <br />
              끌어올릴 수 있어요
            </strong>
            <CustomGuideContent className="mt-4" />
          </>
        )}
        {/* MaxCount */}
        {resumeState.type === "MaxCount" && (
          <>
            <strong className="text-lg">
              <span className="text-orange-500">게시글당 최대 15번</span> 끌어올릴 수 있어요
              <br />
              이 게시글은 이미 15번을 모두 사용해서
              <br />
              더이상 끌어올릴 수 없어요
            </strong>
            <CustomGuideContent className="mt-4" />
          </>
        )}
        {/* ReadyFreeProduct */}
        {resumeState.type === "ReadyFreeProduct" && (
          <>
            <strong className="text-lg">
              {user?.name}님,
              <br />
              지금 끌어올리시겠어요?
            </strong>
            <div className="mt-4">
              <EditProductResume
                formType="update"
                formData={formData}
                onValid={submitProduct}
                isLoading={loadingProduct}
                resumeDiffStr={resumeTimeState.diffStr}
                nextResumeDiffStr={nextResumeTimeState.diffStr}
              />
            </div>
          </>
        )}
        {/* ReadyPayProduct */}
        {resumeState.type === "ReadyPayProduct" && (
          <>
            <strong className="text-lg">
              {user?.name}님, 끌어올리기 전에
              <br />
              가격을 낮춰보세요
            </strong>
            <div className="mt-4">
              <EditProductResume
                formType="update"
                formData={formData}
                onValid={submitProduct}
                isLoading={loadingProduct}
                resumeDiffStr={resumeTimeState.diffStr}
                nextResumeDiffStr={nextResumeTimeState.diffStr}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProductsDetail: { options: { url: string; query: string }; response: GetProductsDetailResponse };
}> = ({ getUser, getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProductsDetail?.options?.url}?${getProductsDetail?.options?.query}`]: getProductsDetail.response,
        },
      }}
    >
      <ProductsResumePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const productId = params?.id?.toString() || "";

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/products/${productId}`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  // getProductsDetail
  const productsDetail =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!productsDetail?.product) {
    return {
      redirect: {
        permanent: false,
        destination: `/products/${productId}`,
      },
    };
  }

  const isInvalid = {
    user: !(productsDetail?.productCondition?.role?.myRole === "sellUser"),
    product: !productsDetail?.productCondition?.isSale,
  };

  // isInvalid
  // redirect: redirectDestination ?? `/products/${productId}`,
  if (Object.values(isInvalid).includes(true)) {
    let redirectDestination = null;
    return {
      redirect: {
        permanent: false,
        destination: redirectDestination ?? `/products/${productId}`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `끌어올리기 | ${truncateStr(productsDetail?.product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "끌어올리기",
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
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProductsDetail: {
        options: {
          url: `/api/products/${productId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(productsDetail || {})),
        },
      },
    },
  };
});

export default Page;
