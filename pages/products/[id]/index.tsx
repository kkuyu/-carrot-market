import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { PageLayout } from "@libs/states";
import { getProductCategory, getDiffTimeStr } from "@libs/utils";
import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProductsDetailOthersResponse } from "@api/products/[id]/others";
import { PostProductsLikeResponse } from "@api/products/[id]/like";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostChatsResponse } from "@api/chats";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import Relate from "@components/cards/relate";
import Buttons from "@components/buttons";
import Profiles from "@components/profiles";
import PictureSlider, { PictureSliderItem } from "@components/groups/pictureSlider";

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
  const [mounted, setMounted] = useState(false);
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.product?.userId ? "public" : "private",
  });

  // static data: product detail
  const today = new Date();
  const diffTime = getDiffTimeStr(new Date(staticProps?.product?.createdAt).getTime(), today.getTime());
  const category = getProductCategory(staticProps?.product?.category);
  const [product, setProduct] = useState<GetProductsDetailResponse["product"] | null>(staticProps?.product ? staticProps.product : null);

  const saleRecord = product?.records?.find((record) => record.kind === Kind.ProductSale);
  const likeRecords = product?.records?.filter((record) => record.kind === Kind.ProductLike) || [];
  const foundChats = product?.chats?.filter((chat) => chat._count.chatMessages > 0);

  const liked = Boolean(likeRecords.find((record) => record.userId === user?.id));
  const shortName = !product?.name ? "" : product.name.length <= 15 ? product.name : product.name.substring(0, 15) + "...";
  const thumbnails: PictureSliderItem[] = !product?.photos
    ? []
    : product.photos.split(",").map((src, index, array) => ({
        src,
        index,
        key: `thumbnails-slider-${index + 1}`,
        label: `${index + 1}/${array.length}`,
        name: `게시글 이미지 ${index + 1}/${array.length} (${shortName})`,
      }));

  // fetch data: product detail
  const { data, error, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(router.query.id && product ? `/api/products/${router.query.id}` : null);
  const { data: othersData } = useSWR<GetProductsDetailOthersResponse>(router.query.id && product ? `/api/products/${router.query.id}/others` : null);
  const [updateLike, { loading: likeLoading }] = useMutation<PostProductsLikeResponse>(`/api/products/${router.query.id}/like`, {
    onSuccess: (data) => {
      boundMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });
  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(router.query.id ? `/api/products/${router.query.id}/sale` : "", {
    onSuccess: (data) => {
      if (!data.recordSale) {
        router.push(`/products/${router.query.id}/purchase`);
      } else {
        boundMutate();
      }
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // fetch data: chat
  const [createChat, { loading: createChatLoading }] = useMutation<PostChatsResponse>(`/api/chats`, {
    onSuccess: (data) => {
      router.push(`/chats/${data.chat.id}`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // toggle like
  const toggleLike = () => {
    if (!product) return;
    if (likeLoading) return;

    boundMutate((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      const idx = records.findIndex((record) => record.kind === Kind.ProductLike && record.userId === user?.id);
      const exists = idx !== -1;
      if (exists) records.splice(idx, 1);
      if (!exists) records.push({ id: 0, kind: Kind.ProductLike, userId: user?.id! });
      return (
        prev && {
          ...prev,
          product: { ...prev.product, records: records },
        }
      );
    }, false);
    updateLike({});
  };

  const toggleSale = (value: boolean) => {
    if (!product) return;
    if (saleLoading) return;

    boundMutate((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      const idx = records.findIndex((record) => record.kind === Kind.ProductSale);
      const exists = idx !== -1;
      if (exists) records.splice(idx, 1);
      if (!exists) records.push({ id: 0, kind: Kind.ProductSale, userId: user?.id! });
      return (
        prev && {
          ...prev,
          product: { ...prev.product, records: records },
        }
      );
    }, false);
    updateSale({ sale: value });
  };

  const goChat = () => {
    if (!product) return;
    if (!user || user.id === -1) return;
    if (createChatLoading) return;
    createChat({
      userIds: [user.id, product.user.id],
      productId: product.id,
    });
  };

  // modal: welcome
  const openWelcomeModal = () => {
    openModal<MessageModalProps>(MessageModal, "welcome", {
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

  // modal: sale
  const openSaleModal = () => {
    openModal<MessageModalProps>(MessageModal, "sale", {
      type: "confirm",
      hasBackdrop: true,
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요. 그래도 변경하시겠어요?",
      confirmBtn: "변경",
      onConfirm: () => toggleSale(true),
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
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!product) return;

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
                { key: "report", text: "신고", onClick: () => console.log("신고") },
                { key: "block", text: "이 사용자의 글 보지 않기", onClick: () => console.log("이 사용자의 글 보지 않기") },
              ]
            : mode === "private" && saleRecord
            ? [
                { key: "sold", text: "판매완료", onClick: () => toggleSale(false) },
                { key: "edit", text: "게시글 수정", onClick: () => router.push(`/products/${product.id}/edit`) },
                { key: "resume", text: "끌어올리기", onClick: () => router.push(`/products/${product.id}/resume`) },
                { key: "delete", text: "삭제", onClick: () => router.push(`/products/${product.id}/delete`) },
              ]
            : mode === "private" && !saleRecord
            ? [
                { key: "sale", text: "판매중", onClick: () => (product?.reviews?.length ? openSaleModal() : toggleSale(true)) },
                { key: "review", text: "거래 후기 보내기", onClick: () => router.push(`/products/${product.id}/review`) },
                { key: "edit", text: "게시글 수정", onClick: () => router.push(`/products/${product.id}/edit`) },
                { key: "delete", text: "삭제", onClick: () => router.push(`/products/${product.id}/delete`) },
              ]
            : [],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id, product?.userId, product?.reviews, product?.records]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!product) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      {/* 썸네일 */}
      {Boolean(thumbnails.length) && (
        <div className="-mx-5">
          <PictureSlider list={thumbnails} defaultIndex={0} />
        </div>
      )}

      {/* 판매 상품 정보 */}
      <section className="block">
        {/* 판매자 */}
        <Link href={`/users/profiles/${product?.user?.id}`}>
          <a className="block py-3">
            <Profiles user={product?.user} emdPosNm={product?.emdPosNm} />
          </a>
        </Link>

        {/* 설명 */}
        <div className="pt-5 border-t">
          <h1 className="text-2xl font-bold">
            {!saleRecord && <em className="text-gray-500 not-italic">판매완료 </em>}
            {product.name}
          </h1>
          <span className="mt-1 block text-sm text-gray-500">
            {[category?.text, mounted && diffTime ? diffTime : null, !product?.resumeCount ? null : `끌올 ${product.resumeCount}회`].filter((v) => !!v).join(" · ")}
          </span>
          <p className="mt-5 whitespace-pre-wrap">{product.description}</p>
          <div className="empty:hidden mt-5 text-sm text-gray-500">
            {[likeRecords.length ? `관심 ${likeRecords.length}` : null, foundChats?.length ? `채팅 ${foundChats.length}` : null].filter((v) => !!v).join(" · ")}
          </div>
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
                <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-500" onClick={openWelcomeModal} disabled={likeLoading}>
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
                <button className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-500" onClick={user?.id === -1 ? openSignUpModal : toggleLike} disabled={likeLoading}>
                  {liked && (
                    <svg className="w-6 h-6" fill="currentColor" color="rgb(239 68 68)" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                    </svg>
                  )}
                  {!liked && (
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
              {viewModel.mode === "public" && <Buttons tag="button" text="채팅하기" size="sm" onClick={user?.id === -1 ? openSignUpModal : goChat} />}
              {viewModel.mode === "private" && <Buttons tag="button" text="대화 중인 채팅방" size="sm" onClick={() => router.push(`/products/${product.id}/chats`)} />}
            </div>
          </div>
        </div>
      </section>

      {/* <div>todo: 신고하기</div> */}

      {/* 관련 상품목록 */}
      {Boolean(othersData?.otherProducts.length) && (
        <section className="mt-5 pt-5 border-t">
          <h2 className="text-xl">
            {othersData?.type === "userProducts"
              ? `${data?.product.user.name}님의 판매 상품`
              : othersData?.type === "similarProducts"
              ? `이 글과 함께 봤어요`
              : othersData?.type === "latestProducts"
              ? `최근 등록된 판매 상품`
              : ""}
          </h2>
          <ul className="-m-2 mt-4 block after:block after:clear-both">
            {othersData?.otherProducts.map((item) => {
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
          OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }],
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
