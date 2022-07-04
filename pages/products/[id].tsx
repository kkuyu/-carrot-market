import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
import { getDiffTimeStr } from "@libs/utils";

import { PageLayout } from "@libs/states";
import { GetProductDetailResponse } from "@api/products/[id]";

import Buttons from "@components/buttons";
import { ThumbnailSlider, ThumbnailItem } from "@components/sliders";
import { RelateList } from "@components/lists";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

interface ProductExtraInfo {
  relate: {
    name: string;
    products: GetProductDetailResponse["otherProducts"] | GetProductDetailResponse["similarProducts"] | GetProductDetailResponse["latestProducts"];
  };
  diffTime: string;
}

const ProductDetail: NextPage<{
  staticProps: {
    product: GetProductDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();
  const { openModal } = useModal();

  // static data: product detail
  const today = new Date();
  const [product, setProduct] = useState<(GetProductDetailResponse["product"] & ProductExtraInfo) | null>(() => {
    if (!staticProps?.product) return null;
    return {
      ...staticProps?.product,
      relate: { name: "", products: [] },
      diffTime: getDiffTimeStr(new Date(staticProps?.product.updatedAt).getTime(), today.getTime()),
    };
  });
  const thumbnails: ThumbnailItem[] = (staticProps?.product?.photo ? staticProps.product.photo.split(",") : []).map((src, index, array) => ({
    src,
    index,
    key: `thumbnails-slider-${index + 1}`,
    label: `${index + 1}/${array.length}`,
    name: `${staticProps?.product?.name} | 상품 이미지 ${array.length > 1 ? index + 1 : ""}`,
  }));

  // fetch data: product detail
  const { data, error, mutate: boundMutate } = useSWR<GetProductDetailResponse>(router.query.id && product ? `/api/products/${router.query.id}` : null);
  const [updateFavorite, { loading: favoriteLoading }] = useMutation(`/api/products/${router.query.id}/favorite`, {
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // click favorite
  const toggleFavorite = () => {
    if (!product) return;
    if (favoriteLoading) return;
    boundMutate((prev) => prev && { ...prev, isFavorite: !prev.isFavorite }, false);
    updateFavorite({});
  };

  // modal: sign up
  const openSignUpModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "휴대폰 인증하고 회원가입하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "회원가입",
      hasBackdrop: true,
      onConfirm: () => {
        router.replace(`/join?addrNm=${user?.MAIN_emdAddrNm}`);
      },
    });
  };

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setProduct((prev) => ({
      ...prev,
      ...data.product,
      relate: data.otherProducts.length
        ? { name: `${data?.product.user.name}님의 판매 상품`, products: data.otherProducts }
        : data.similarProducts.length
        ? { name: `이 글과 함께 봤어요`, products: data.similarProducts }
        : { name: `최근 등록된 판매 상품`, products: data.latestProducts },
      diffTime: getDiffTimeStr(new Date(data?.product.updatedAt).getTime(), today.getTime()),
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!product) {
      router.push("/");
      return;
    }

    setLayout(() => ({
      title: product?.name || "",
      seoTitle: `${product?.name || ""} | 상품 상세`,
      header: {
        headerColor: Boolean(thumbnails.length) ? "transparent" : "white",
        headerUtils: ["back", "share", "home"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  if (!product) {
    return null;
  }

  return (
    <article className="container pb-20">
      {/* 썸네일 */}
      {Boolean(thumbnails.length) && (
        <div className="-mx-5">
          <ThumbnailSlider list={thumbnails} defaultIndex={0} />
        </div>
      )}

      {/* 상품 정보 */}
      <section className="block">
        {/* 판매자 */}
        <Link href={`/users/profiles/${product.user.id}`}>
          <a className="flex items-center py-3 border-b">
            <div className="relative flex-none w-14 h-14 bg-slate-300 rounded-full">
              {product.user?.avatar ? (
                <>
                  <span className="block pb-[100%]"></span>
                  <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${product.user?.avatar}/avatar`} alt="" layout="fill" objectFit="cover" />
                </>
              ) : (
                <svg className="mx-auto my-4 w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  ></path>
                </svg>
              )}
            </div>
            <div className="grow pl-3">
              <strong className="block text-base font-semibold text-gray-700">{product.user?.name}</strong>
              <span className="block text-sm font-semibold text-gray-500">{product.emdPosNm}</span>
            </div>
            {/* <div>todo: 매너온도</div> */}
          </a>
        </Link>

        {/* 설명 */}
        <div className="mt-5">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <span className="mt-2 block text-sm text-gray-500">{product.diffTime}</span>
          {/* todo: 카테고리 */}
          {/* todo: 끌어올리기 */}
          <p className="mt-5 whitespace-pre-wrap">{product.description}</p>
        </div>

        {/* 가격, 채팅 */}
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
            <div className="relative flex-none mx-1.5 after:absolute after:top-1/2 after:-right-1.5 after:-mt-4 after:w-[1px] after:h-8 after:bg-gray-300">
              <button
                className={`p-2 rounded-md hover:bg-gray-100 ${data?.isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400  hover:text-gray-500"}`}
                onClick={() => (user?.id === -1 ? openSignUpModal() : toggleFavorite())}
                disabled={favoriteLoading}
              >
                {data?.isFavorite ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="h-6 w-6 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="grow pl-4">
              {/* todo: 가격 제안 가능 여부 */}
              <strong>₩{product.price}</strong>
            </div>
            <div className="flex-none px-4">
              {user?.id === -1 ? (
                <Buttons tag="button" text="채팅하기" size="sm" onClick={openSignUpModal} />
              ) : (
                <Link href={`/inbox/${product.user.id}`} passHref>
                  <Buttons tag="a" text="채팅하기" size="sm" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* <div>todo: 신고하기</div> */}

      {/* 관련 상품목록 */}
      {Boolean(product.relate.products.length) && (
        <section className="mt-5 pt-5 border-t">
          <h2 className="text-xl">{product.relate.name}</h2>
          <div className="mt-4">
            <RelateList list={product.relate.products || []} pathname="/products/[id]" />
          </div>
        </section>
      )}
    </article>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const productId = context?.params?.id?.toString();

  // invalid params: productId
  if (!productId || isNaN(+productId)) {
    return {
      props: {},
    };
  }

  // find product
  const product = await client.product.findUnique({
    where: {
      id: +productId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  // not found product
  if (!product) {
    return {
      props: {},
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product)),
      },
    },
  };
};

export default ProductDetail;
