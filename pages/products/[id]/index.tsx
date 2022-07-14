import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Error from "next/error";
import { useRef, useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getCategory, getDiffTimeStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Profiles from "@components/profiles";
import Buttons from "@components/buttons";
import Relate from "@components/cards/relate";
import ThumbnailSlider, { ThumbnailSliderItem } from "@components/groups/thumbnailSlider";

const ProductDetail: NextPage<{
  staticProps: {
    product: GetProductsDetailResponse["product"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  // view model
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.product?.userId ? "public" : "private",
  });

  // static data: product detail
  const diffTime = useRef("");
  const category = getCategory("product", staticProps?.product?.category);
  const [product, setProduct] = useState<GetProductsDetailResponse["product"] | null>(staticProps?.product ? staticProps.product : null);

  const isSale = product?.records && Boolean(product?.records?.find((record) => record.kind === "Sale"));
  const isSold = product?.records && !isSale;
  const favorites = product?.records?.filter((record) => record.kind === "Favorite") || [];
  const shortName = !product?.name ? "" : product.name.length <= 15 ? product.name : product.name.substring(0, 15) + "...";
  const thumbnails: ThumbnailSliderItem[] = !product?.photos
    ? []
    : product.photos.split(",").map((src, index, array) => ({
        src,
        index,
        key: `thumbnails-slider-${index + 1}`,
        label: `${index + 1}/${array.length}`,
        name: `게시글 이미지 ${index + 1}/${array.length} (${shortName})`,
      }));
  const [relate, setRelate] = useState<{
    name: string;
    products: GetProductsDetailResponse["otherProducts"] | GetProductsDetailResponse["similarProducts"] | GetProductsDetailResponse["latestProducts"];
  }>({
    name: "",
    products: [],
  });

  // fetch data: product detail
  const { data, error, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(router.query.id && product ? `/api/products/${router.query.id}` : null);
  const [updateFavorite, { loading: favoriteLoading }] = useMutation(`/api/products/${router.query.id}/favorite`, {
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // kebab action: delete
  const [deleteProduct, { loading: deleteLoading }] = useMutation(`/api/products/${router.query.id}/delete`, {
    onSuccess: () => {
      router.replace("/");
    },
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
    boundMutate((prev) => {
      let records = prev?.product.records || [];
      prev?.isFavorite ? records.pop() : records.push({ id: 0, kind: Kind.Favorite, userId: 0 });
      return (
        prev && {
          ...prev,
          product: { ...prev.product, records: records },
          isFavorite: !prev.isFavorite,
        }
      );
    }, false);
    updateFavorite({});
  };

  // modal: welcome
  const openWelcomeModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "당근마켓 첫 방문이신가요?",
      cancelBtn: "취소",
      confirmBtn: "당근마켓 시작하기",
      hasBackdrop: true,
      onConfirm: () => {
        router.push("/welcome");
      },
    });
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
        router.push(`/join?addrNm=${currentAddr?.emdAddrNm}`);
      },
    });
  };

  // modal: delete
  const openDeleteModal = () => {
    openModal<MessageModalProps>(MessageModal, "confirmDeleteProduct", {
      type: "confirm",
      message: "게시글을 정말 삭제하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "삭제",
      hasBackdrop: true,
      onConfirm: () => {
        if (deleteLoading) return;
        deleteProduct({});
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
    }));
    setRelate(() => {
      if (data.otherProducts.length) {
        return {
          name: `${data?.product.user.name}님의 판매 상품`,
          products: data.otherProducts,
        };
      }
      if (data.similarProducts.length) {
        return {
          name: `이 글과 함께 봤어요`,
          products: data.similarProducts,
        };
      }
      return {
        name: `최근 등록된 판매 상품`,
        products: data.latestProducts,
      };
    });
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!product) return;

    const today = new Date();
    diffTime.current = getDiffTimeStr(new Date(product?.updatedAt).getTime(), today.getTime());

    const mode = !user?.id ? "preview" : user?.id !== product?.userId ? "public" : "private";
    setViewModel({ mode });

    setLayout(() => ({
      title: product?.name || "",
      seoTitle: `${product?.name || ""} | 판매 상품 상세`,
      header: {
        headerUtils: ["back", "home", "share", "kebab"],
        headerColor: Boolean(thumbnails.length) ? "transparent" : "white",
        kebabActions:
          mode === "preview"
            ? [{ key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) }]
            : mode === "public"
            ? [
                { key: "report", text: "신고" },
                { key: "block", text: "이 사용자의 글 보지 않기" },
              ]
            : mode === "private"
            ? [
              { key: "edit", text: "게시글 수정", onClick: () => router.push(`/products/${product.id}/edit`) },
              { key: "pull", text: "끌어올리기" },
              { key: "hide", text: "숨기기" },
              { key: "delete", text: "삭제", onClick: () => openDeleteModal() },
            ]
            : [],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id]);

  if (!product) {
    return <Error statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      {/* 썸네일 */}
      {Boolean(thumbnails.length) && (
        <div className="-mx-5">
          <ThumbnailSlider
            list={thumbnails}
            defaultIndex={0}
            modal={{
              title: `판매 상품 이미지 (${shortName})`,
            }}
          />
        </div>
      )}

      {/* 판매 상품 정보 */}
      <section className="block">
        {/* 판매자 */}
        <Link href={`/users/profiles/${product?.user?.id}`}>
          <a>
            <Profiles user={product?.user} emdPosNm={product?.emdPosNm} />
          </a>
        </Link>

        {/* 설명 */}
        <div className="pt-5 border-t">
          <h1 className="text-2xl font-bold">
            {isSold && <em className="text-gray-500 not-italic">판매완료 </em>}
            {product.name}
          </h1>
          <span className="mt-1 block text-sm text-gray-500">
            {/* todo: 끌어올리기 */}
            {category?.text} · {diffTime.current}
          </span>
          <p className="mt-5 whitespace-pre-wrap">{product.description}</p>
          <div className="empty:hidden mt-5 text-sm text-gray-500">{[favorites.length ? `관심 ${favorites.length}` : null].filter((v) => !!v).join(" · ")}</div>
        </div>

        {/* 가격, 채팅 */}
        <div className="fixed bottom-0 left-0 w-full z-[50]">
          <div className="relative flex items-center mx-auto w-full h-16 max-w-xl border-t bg-white">
            <div className="relative grow pl-16 before:absolute before:top-1/2 before:left-16 before:-mt-2.5 before:-ml-2.5 before:w-[1px] before:h-5 before:bg-gray-300">
              {/* todo: 가격 제안 가능 여부 */}
              <strong>₩{product.price}</strong>
            </div>
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              {viewModel.mode === "preview" && (
                <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-500" onClick={openWelcomeModal} disabled={favoriteLoading}>
                  <svg className="h-6 w-6 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              )}
              {(viewModel.mode === "public" || viewModel.mode === "private") && (
                <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-500" onClick={user?.id === -1 ? openSignUpModal : toggleFavorite} disabled={favoriteLoading}>
                  {data?.isFavorite && (
                    <svg className="w-6 h-6" fill="currentColor" color="rgb(239 68 68)" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                  </svg>
                  )}
                  {!data?.isFavorite && (
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
              )}
            </div>
              <div className="flex-none px-5">
              {viewModel.mode === "preview" && (
                <Link href="/welcome" passHref>
                  <Buttons tag="a" text="당근마켓 시작하기" size="sm" />
                </Link>
              )}
              {viewModel.mode === "public" &&
                (user?.id === -1 ? (
                  <Buttons tag="button" text="채팅하기" size="sm" onClick={openSignUpModal} />
                ) : (
                  <Link href={`/inbox/${product.user.id}`} passHref>
                    <Buttons tag="a" text="채팅하기" size="sm" />
                  </Link>
                ))}
              {viewModel.mode === "private" && (
                <Link href="" passHref>
                  <Buttons tag="a" text="대화 중인 채팅방" size="sm" />
                </Link>
              )}
              </div>
          </div>
        </div>
      </section>

      {/* <div>todo: 신고하기</div> */}

      {/* 관련 상품목록 */}
      {Boolean(relate.products.length) && (
        <section className="mt-5 pt-5 border-t">
          <h2 className="text-xl">{relate.name}</h2>
          <ul className="-m-2 mt-4 block after:block after:clear-both">
            {relate.products.map((item) => {
              return (
                <li key={item?.id} className="float-left w-1/2 p-2">
                  <Link href={`/products/${item.id}`}>
                    <a className="block">
                      <Relate item={item} />
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.id?.toString();

  // invalid params: productId
  // redirect: /
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
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      records: {
        where: {
          OR: [{ kind: Kind.Sale }, { kind: Kind.Favorite }],
        },
        select: {
          id: true,
          kind: true,
          userId: true,
        },
      },
    },
  });

  // not found product
  // 404
  if (!product) {
    return {
      notFound: true,
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        product: JSON.parse(JSON.stringify(product || {})),
      },
    },
  };
};

export default ProductDetail;
