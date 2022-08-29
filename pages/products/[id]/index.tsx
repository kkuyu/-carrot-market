import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getCategory, getDiffTimeStr, truncateStr } from "@libs/utils";
import useLayouts from "@libs/client/useLayouts";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import client from "@libs/server/client";
// @api
import { ProductCategories } from "@api/products/types";
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProductsDetailOthersResponse } from "@api/products/[id]/others";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostChatsResponse } from "@api/chats";
// @app
import { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import { ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
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
  const category = data && getCategory<ProductCategories>(data?.product?.category);

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
    openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
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
    openModal<AlertModalProps>(AlertModal, "ConfirmSoldToSale", {
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요.\n그래도 변경하시겠어요?",
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: null,
        },
        {
          key: "destructive",
          style: AlertStyleEnum["destructive"],
          text: "변경",
          handler: () => toggleSale(),
        },
      ],
    });
  };

  // setting layout
  useEffect(() => {
    if (!userType) return;
    if (!data?.product) return;
    const kebabActions = [
      { key: "welcome", style: ActionStyleEnum["primary"], text: "당근마켓 시작하기", handler: () => router.push(`/welcome`) },
      { key: "report", style: ActionStyleEnum["destructive"], text: "신고", handler: () => console.log("신고") },
      { key: "block", style: ActionStyleEnum["default"], text: "이 사용자의 글 보지 않기", handler: () => console.log("이 사용자의 글 보지 않기") },
      { key: "sold", style: ActionStyleEnum["default"], text: "판매완료", handler: () => toggleSale() },
      { key: "edit", style: ActionStyleEnum["default"], text: "게시글 수정", handler: () => router.push(`/products/${data?.product?.id}/edit`) },
      { key: "resume", style: ActionStyleEnum["default"], text: "끌어올리기", handler: () => router.push(`/products/${data?.product?.id}/resume`) },
      { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => router.push(`/products/${data?.product?.id}/delete`) },
      { key: "sale", style: ActionStyleEnum["default"], text: "판매중", handler: () => (data?.product?.reviews?.length ? openSaleModal() : toggleSale()) },
      { key: "review", style: ActionStyleEnum["default"], text: "거래 후기 보내기", handler: () => router.push(`/products/${data?.product?.id}/review`) },
      { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
    ];
    changeLayout({
      meta: {},
      header: {
        kebabActions:
          userType === "guest"
            ? kebabActions.filter((action) => ["welcome", "cancel"].includes(action.key))
            : user?.id !== data?.product?.userId
            ? kebabActions.filter((action) => ["report", "block", "cancel"].includes(action.key))
            : saleRecord
            ? kebabActions.filter((action) => ["sold", "edit", "resume", "delete", "cancel"].includes(action.key))
            : kebabActions.filter((action) => ["sale", "edit", "review", "delete", "cancel"].includes(action.key)),
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
              data?.product?.photos?.split(";")?.map((src, index, array) => ({
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
          <div className="mt-1 text-description text-sm">
            {category?.text ? (
              <Link href={`/products/categories/${category.kebabValue}`} passHref>
                <Buttons tag="a" sort="text-link" size="sm" status="unset" className="underline">
                  {category?.text}
                </Buttons>
              </Link>
            ) : null}
            {mounted && diffTime && <span>{diffTime}</span>}
            {!!data?.product?.resumeCount && <span>끌올 {data?.product?.resumeCount}회</span>}
          </div>
          <p className="mt-5 whitespace-pre-wrap">{data?.product?.description}</p>
          <div className="empty:hidden mt-5 text-description text-gray-500">
            {!!likeRecords.length && <span>관심 {likeRecords.length}</span>}
            {!!foundChats?.length && <span>채팅 {foundChats.length}</span>}
          </div>
        </div>

        {/* 가격, 채팅 */}
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-14 border-t bg-white">
            <div className="relative grow-full ml-14 pl-3 border-l">
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
                    <Buttons tag="a" size="sm">
                      당근마켓 시작하기
                    </Buttons>
                  </Link>
                ) : user?.id !== data?.product?.userId ? (
                  <Buttons tag="button" type="button" size="sm" onClick={clickChat}>
                    채팅하기
                  </Buttons>
                ) : (
                  <Link href={`/products/${data?.product?.id}/chats`} passHref>
                    <Buttons tag="a" size="sm">
                      대화 중인 채팅방
                    </Buttons>
                  </Link>
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
              ? `이 글과 함께 본 판매 상품`
              : othersData?.type === "categoryProducts"
              ? `${category?.text} 판매상품`
              : othersData?.type === "latestProducts"
              ? `최근 등록된 판매 상품`
              : ""}
          </h2>
          <ul className="-m-2 mt-4 flex flex-wrap">
            {othersData?.otherProducts.map((item) => {
              return (
                <li key={item?.id} className="w-1/2 p-2">
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
