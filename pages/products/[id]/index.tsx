import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getProductCondition, truncateStr } from "@libs/utils";
import useLayouts from "@libs/client/useLayouts";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
import useTimeDiff from "@libs/client/useTimeDiff";
// @api
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { GetProductsDetailRecommendsResponse, RecommendsTypeEnum } from "@api/products/[id]/recommends";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostProductsViewsResponse } from "@api/products/[id]/views";
import { PostChatsResponse } from "@api/chats";
// @app
import { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import { ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Buttons from "@components/buttons";
import Profiles from "@components/profiles";
import LikeProduct from "@components/groups/likeProduct";
import PictureSlider from "@components/groups/pictureSlider";
import ArticleReport from "@components/groups/articleReport";
import ProductSquareList from "@components/lists/productSquareList";

const ProductsDetailPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  // fetch data
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(router.query.id ? `/api/products/${router.query.id}?` : null);
  const { data: recommendsData } = useSWR<GetProductsDetailRecommendsResponse>(router.query.id ? `/api/products/${router.query.id}/recommends?` : null);

  // mutation data
  const [updateProductSale, { loading: loadingProductSale }] = useMutation<PostProductsSaleResponse>(router.query.id ? `/api/products/${router.query.id}/sale` : "", {
    onSuccess: async (data) => {
      await mutateProduct();
      if (!data.recordSale) await router.push(`/products/${router.query.id}/purchase/available`);
    },
  });
  const [createChat, { loading: loadingChat }] = useMutation<PostChatsResponse>(`/api/chats`, {
    onSuccess: async (data) => {
      await router.push(`/chats/${data.chat.id}`);
    },
  });

  // variable: visible
  const { isMounted, timeState } = useTimeDiff(productData?.product?.createdAt.toString() || null);

  // update: Record.Kind.ProductSale
  const toggleSale = (sale: boolean) => {
    if (loadingProductSale) return;
    if (!productData?.product) return;
    const currentCondition = productData?.productCondition ?? getProductCondition(productData?.product, user?.id);
    if (currentCondition?.isSale === sale) return;
    mutateProduct((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      if (currentCondition?.isSale) records = records.filter((record) => record.kind !== Kind.ProductSale);
      if (!currentCondition?.isSale) records = [...records, { id: 0, kind: Kind.ProductSale, userId: user?.id! }];
      return prev && { ...prev, product: { ...prev.product, records }, productCondition: getProductCondition({ ...productData?.product, records }, user?.id) };
    }, false);
    updateProductSale({ sale: !currentCondition?.isSale });
  };

  // create: Chat
  const clickChat = () => {
    if (loadingChat) return;
    createChat({
      userIds: [user?.id, productData?.product?.user?.id],
      productId: productData?.product?.id,
    });
  };

  // modal: ConfirmSoldToSale
  const openSaleModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmSoldToSale", {
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요.\n그래도 변경하시겠어요?",
      actions: [
        { key: "cancel", style: AlertStyleEnum["cancel"], text: "취소", handler: null },
        { key: "destructive", style: AlertStyleEnum["destructive"], text: "변경", handler: () => toggleSale(true) },
      ],
    });
  };

  // change: layout
  useEffect(() => {
    if (!userType) return;
    if (!productData?.product) return;
    const kebabActions = [
      { key: "welcome", style: ActionStyleEnum["primary"], text: "당근마켓 시작하기", handler: () => router.push(`/welcome`) },
      { key: "sale", style: ActionStyleEnum["default"], text: "판매중", handler: () => (productData?.product?.reviews?.length ? openSaleModal() : toggleSale(true)) },
      { key: "sold", style: ActionStyleEnum["default"], text: "판매완료", handler: () => toggleSale(false) },
      { key: "resume", style: ActionStyleEnum["default"], text: "끌어올리기", handler: () => router.push(`/products/${productData?.product?.id}/resume`) },
      { key: "edit", style: ActionStyleEnum["default"], text: "게시글 수정", handler: () => router.push(`/products/${productData?.product?.id}/edit`) },
      { key: "review", style: ActionStyleEnum["default"], text: "거래 후기 보내기", handler: () => router.push(`/products/${productData?.product?.id}/review`) },
      { key: "block", style: ActionStyleEnum["default"], text: "이 사용자의 글 보지 않기", handler: () => console.log("이 사용자의 글 보지 않기") },
      { key: "report", style: ActionStyleEnum["destructive"], text: "신고", handler: () => console.log("신고") },
      { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => router.push(`/products/${productData?.product?.id}/delete`) },
      { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
    ];
    changeLayout({
      header: {
        kebabActions:
          userType === "guest"
            ? kebabActions.filter((action) => ["welcome", "cancel"].includes(action.key))
            : user?.id !== productData?.product?.userId
            ? kebabActions.filter((action) => ["report", "block", "cancel"].includes(action.key))
            : productData?.productCondition?.isSale
            ? kebabActions.filter((action) => ["sold", "edit", "resume", "delete", "cancel"].includes(action.key))
            : kebabActions.filter((action) => ["sale", "edit", "review", "delete", "cancel"].includes(action.key)),
      },
    });
  }, [productData?.product, user?.id, userType]);

  if (!productData?.success || !productData?.product) {
    return <NextError statusCode={404} />;
  }

  return (
    <article>
      {/* 중고거래: 썸네일 */}
      {Boolean(productData?.product?.photos?.length) && (
        <PictureSlider
          list={
            productData?.product?.photos?.split(";")?.map((src, index, array) => ({
              src,
              index,
              key: `thumbnails-slider-${index + 1}`,
              label: `${index + 1}/${array.length}`,
              name: `게시글 이미지 ${index + 1}/${array.length} (${truncateStr(productData?.product?.name, 15)})`,
            })) || []
          }
          defaultIndex={0}
        />
      )}

      {/* 중고거래: 상세정보 */}
      <div className="container pb-16">
        <section className="">
          {/* 판매자 */}
          {productData?.product?.user && (
            <Link href={`/profiles/${productData?.product?.user?.id}`}>
              <a className="block py-3">
                <Profiles user={productData?.product?.user} emdPosNm={productData?.product?.emdPosNm} />
              </a>
            </Link>
          )}

          {/* 설명 */}
          <div className="pt-5 border-t">
            <h1 className="text-2xl font-bold">
              {productData?.productCondition && !productData?.productCondition?.isSale && <em className="text-gray-500 not-italic">판매완료 </em>}
              {productData?.product?.name}
            </h1>
            <div className="mt-1 text-description text-sm">
              {productData?.productCondition?.category ? (
                <Link href={`/products/categories/${productData?.productCondition?.category?.kebabCaseValue}`} passHref>
                  <Buttons tag="a" sort="text-link" size="sm" status="unset" className="underline">
                    {productData?.productCondition?.category?.text}
                  </Buttons>
                </Link>
              ) : null}
              {isMounted && timeState.diffStr && <span>{timeState.diffStr}</span>}
              {!!productData?.product?.resumeCount && <span>끌올 {productData?.product?.resumeCount}회</span>}
            </div>
            <div className="mt-5 whitespace-pre-wrap">
              <>{productData?.product?.description}</>
            </div>
            <ArticleReport<PostProductsViewsResponse>
              fetchUrl={isMounted && productData?.product ? `/api/products/${productData?.product?.id}/views` : null}
              initialState={{ id: productData?.product?.id, views: productData?.product?.views }}
              className="empty:hidden mt-5"
            >
              {productData?.productCondition && Boolean(productData?.productCondition?.likes) ? <span>관심 {productData?.productCondition?.likes}</span> : <></>}
              {productData?.productCondition && Boolean(productData?.productCondition?.chats) ? <span>채팅 {productData?.productCondition?.chats}</span> : <></>}
            </ArticleReport>
          </div>

          {/* 가격, 채팅 */}
          <div className="fixed-container bottom-0 z-[50]">
            <div className="fixed-inner flex items-center h-14 border-t bg-white">
              <div className="relative grow-full ml-14 pl-3 border-l">
                {/* todo: 가격 제안 가능 여부 */}
                <strong>₩{productData?.product?.price}</strong>
              </div>
              <LikeProduct item={productData?.product} className="absolute top-1/2 left-3 -translate-y-1/2 hover:bg-gray-100 text-gray-400 hover:text-gray-500" />
              <div className="flex-none px-5">
                {userType && (
                  <>
                    {userType === "guest" ? (
                      // guest
                      <Link href="/welcome" passHref>
                        <Buttons tag="a" size="sm">
                          당근마켓 시작하기
                        </Buttons>
                      </Link>
                    ) : userType === "non-member" ? (
                      // non-member
                      <Buttons tag="button" type="button" size="sm" onClick={() => openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {})}>
                        채팅하기
                      </Buttons>
                    ) : userType === "member" && user?.id !== productData?.product?.userId ? (
                      // member && not my product
                      <Buttons tag="button" type="button" size="sm" onClick={clickChat}>
                        채팅하기
                      </Buttons>
                    ) : (
                      // member && my product
                      <Link href={`/products/${productData?.product?.id}/chats`} passHref>
                        <Buttons tag="a" size="sm">
                          대화 중인 채팅방
                        </Buttons>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* <div>todo: 신고하기</div> */}

        {/* 중고거래: 상품목록 */}
        {Boolean(recommendsData?.products?.length) && (
          <section className="mt-5 pt-5 border-t">
            <h2 className="text-xl">
              {recommendsData?.type === RecommendsTypeEnum.User
                ? `${productData?.product?.user?.name}님의 판매 상품`
                : recommendsData?.type === RecommendsTypeEnum.Similar
                ? `이 글과 함께 본 판매 상품`
                : recommendsData?.type === RecommendsTypeEnum.Latest
                ? `최근 등록된 판매 상품`
                : ""}
            </h2>
            <ProductSquareList list={recommendsData?.products!} className="mt-4" />
          </section>
        )}
      </div>
    </article>
  );
};

const Page: NextPageWithLayout<{
  getProductsDetail: { options: { url: string; query: string }; response: GetProductsDetailResponse };
}> = ({ getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          ...(getProductsDetail ? { [`${getProductsDetail?.options?.url}?${getProductsDetail?.options?.query}`]: getProductsDetail.response } : {}),
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
  // params
  const productId = params?.id?.toString() || "";

  // getProductsDetail
  const productsDetail =
    productId && !isNaN(+productId)
      ? await getProductsDetail({
          id: +productId,
        })
      : {
          product: null,
          productCondition: null,
        };
  if (!productsDetail?.product) {
    return {
      notFound: true,
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(productsDetail?.product?.name, 15)} | 중고거래`,
    },
    header: {
      title: "",
      titleTag: "strong",
      isTransparent: Boolean(productsDetail?.product?.photos?.length) ? true : false,
      utils: ["back", "title", "home", "share", "kebab"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
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
};

export default Page;
