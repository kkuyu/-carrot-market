import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getProductCategory, getDiffTimeStr, truncateStr } from "@libs/utils";
import useLayouts from "@libs/client/useLayouts";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProductsDetailOthersResponse } from "@api/products/[id]/others";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostChatsResponse } from "@api/chats";
// @app
import { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";
import Relate from "@components/cards/relate";
import Buttons from "@components/buttons";
import Profiles from "@components/profiles";
import LikeProduct from "@components/groups/likeProduct";
import PictureSlider from "@components/groups/pictureSlider";

const ProductsDetailPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  // fetch data: product detail
  const { data, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);
  const { data: othersData } = useSWR<GetProductsDetailOthersResponse>(router.query.id ? `/api/products/${router.query.id}/others` : null);

  const [mounted, setMounted] = useState(false);
  const today = new Date();
  const diffTime = data && getDiffTimeStr(new Date(data?.product?.createdAt).getTime(), today.getTime());
  const category = data && getProductCategory(data?.product?.category);

  const saleRecord = data && data?.product?.records?.find((record) => record.kind === Kind.ProductSale);
  const likeRecords = (data && data?.product?.records?.filter((record) => record.kind === Kind.ProductLike)) || [];
  const foundChats = data && data?.product?.chats?.filter((chat) => chat._count.chatMessages > 0);

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

  // sale
  const toggleSale = () => {
    if (!data?.product) return;
    if (saleLoading) return;
    const isSale = !Boolean(saleRecord);
    boundMutate((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      const idx = records.findIndex((record) => record.id === saleRecord?.id);
      if (!isSale) records.splice(idx, 1);
      if (isSale) records.push({ id: 0, kind: Kind.ProductSale, userId: user?.id! });
      return prev && { ...prev, product: { ...prev.product, records } };
    }, false);
    updateSale({ sale: isSale });
  };

  // chat
  const clickChat = () => {
    if (userType === "member") {
      moveChat();
      return;
    }
    openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {});
  };
  const moveChat = () => {
    if (createChatLoading) return;
    createChat({
      userIds: [user?.id, data?.product?.user?.id],
      productId: data?.product?.id,
    });
  };

  // modal: sale
  const openSaleModal = () => {
    openModal<MessageModalProps>(MessageModal, "ConfirmSoldToSale", {
      type: "confirm",
      hasBackdrop: true,
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요. 그래도 변경하시겠어요?",
      confirmBtn: "변경",
      onConfirm: () => toggleSale(),
    });
  };

  // setting layout
  useEffect(() => {
    if (!userType) return;
    if (!data?.product) return;
    const kebabActions = [
      { key: "welcome", text: "당근마켓 시작하기", onClick: () => router.push(`/welcome`) },
      { key: "report", text: "신고", onClick: () => console.log("신고") },
      { key: "block", text: "이 사용자의 글 보지 않기", onClick: () => console.log("이 사용자의 글 보지 않기") },
      { key: "sold", text: "판매완료", onClick: () => toggleSale() },
      { key: "edit", text: "게시글 수정", onClick: () => router.push(`/products/${data?.product?.id}/edit`) },
      { key: "resume", text: "끌어올리기", onClick: () => router.push(`/products/${data?.product?.id}/resume`) },
      { key: "delete", text: "삭제", onClick: () => router.push(`/products/${data?.product?.id}/delete`) },
      { key: "sale", text: "판매중", onClick: () => (data?.product?.reviews?.length ? openSaleModal() : toggleSale()) },
      { key: "review", text: "거래 후기 보내기", onClick: () => router.push(`/products/${data?.product?.id}/review`) },
    ];
    changeLayout({
      meta: {},
      header: {
        kebabActions:
          userType === "guest"
            ? kebabActions.filter((action) => ["welcome"].includes(action.key))
            : user?.id !== data?.product?.userId
            ? kebabActions.filter((action) => ["report", "block"].includes(action.key))
            : saleRecord
            ? kebabActions.filter((action) => ["sold", "edit", "resume", "delete"].includes(action.key))
            : kebabActions.filter((action) => ["sale", "edit", "review", "delete"].includes(action.key)),
      },
      navBar: {},
    });
  }, [data?.product, userType]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!data?.product) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pb-16">
      {/* 썸네일 */}
      {Boolean(data?.product?.photos?.length) && (
        <div className="-mx-5">
          <PictureSlider
            list={
              data?.product?.photos?.split(",")?.map((src, index, array) => ({
                src,
                index,
                key: `thumbnails-slider-${index + 1}`,
                label: `${index + 1}/${array.length}`,
                name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(data?.product?.name, 15)})`,
              })) || []
            }
            defaultIndex={0}
          />
        </div>
      )}

      {/* 중고거래 정보 */}
      <section className="block">
        {/* 판매자 */}
        <Link href={`/profiles/${data?.product?.user?.id}`}>
          <a className="block py-3">
            <Profiles user={data?.product?.user} emdPosNm={data?.product?.emdPosNm} />
          </a>
        </Link>

        {/* 설명 */}
        <div className="pt-5 border-t">
          <h1 className="text-2xl font-bold">
            {!saleRecord && <em className="text-gray-500 not-italic">판매완료 </em>}
            {data?.product?.name}
          </h1>
          <span className="mt-1 block text-sm text-gray-500">
            {[category?.text, mounted && diffTime ? diffTime : null, !data?.product?.resumeCount ? null : `끌올 ${data?.product?.resumeCount}회`].filter((v) => !!v).join(" · ")}
          </span>
          <p className="mt-5 whitespace-pre-wrap">{data?.product?.description}</p>
          <div className="empty:hidden mt-5 text-sm text-gray-500">
            {[likeRecords.length ? `관심 ${likeRecords.length}` : null, foundChats?.length ? `채팅 ${foundChats.length}` : null].filter((v) => !!v).join(" · ")}
          </div>
        </div>

        {/* 가격, 채팅 */}
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-14 border-t bg-white">
            <div className="relative grow ml-14 pl-3 border-l">
              {/* todo: 가격 제안 가능 여부 */}
              <strong>₩{data?.product?.price}</strong>
            </div>
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              <LikeProduct item={data?.product} className="p-2 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-500" />
            </div>
            {userType && (
              <div className="flex-none px-5">
                {userType === "guest" ? (
                  <Link href="/welcome" passHref>
                    <Buttons tag="a" text="당근마켓 시작하기" size="sm" />
                  </Link>
                ) : user?.id !== data?.product?.userId ? (
                  <Buttons tag="button" text="채팅하기" size="sm" onClick={clickChat} />
                ) : (
                  <Buttons tag="button" text="대화 중인 채팅방" size="sm" onClick={() => router.push(`/products/${data?.product?.id}/chats`)} />
                )}
              </div>
            )}
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

const Page: NextPageWithLayout<{
  getProduct: { response: GetProductsDetailResponse };
}> = ({ getProduct }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/products/${getProduct.response.product.id}`]: getProduct.response,
        },
      }}
    >
      <ProductsDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // productId
  const productId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!productId || isNaN(+productId)) invalidUrl = true;
  // 404
  if (invalidUrl) {
    return {
      notFound: true,
    };
  }

  // getProduct
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

  // invalidProduct
  let invalidProduct = false;
  if (!product) invalidProduct = true;
  // 404
  if (invalidProduct) {
    return {
      notFound: true,
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "",
      titleTag: "strong",
      isTransparent: Boolean(product?.photos?.length) ? true : false,
      utils: ["back", "title", "home", "share", "kebab"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getProduct: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
        },
      },
    },
  };
};

export default Page;
