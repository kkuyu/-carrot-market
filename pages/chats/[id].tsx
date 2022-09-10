import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useForm } from "react-hook-form";
import useSWR, { mutate, SWRConfig } from "swr";
// @libs
import { truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetChatsDetailResponse, PostChatsDetailResponse, getChatsDetail } from "@api/chats/[id]";
import { GetProductsDetailResponse, getProductsDetail } from "@api/products/[id]";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { PostProductsPurchaseResponse } from "@api/products/[id]/purchase";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import EditChatMessage, { EditChatMessageTypes } from "@components/forms/editChatMessage";
import ChatMessageList from "@components/lists/chatMessageList";
import ProductSummary from "@components/cards/productSummary";
import Buttons from "@components/buttons";

const ChatsDetailPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { openModal } = useModal();

  // fetch data
  const { data: chatData, mutate: mutateChat } = useSWR<GetChatsDetailResponse>(router.query.id ? `/api/chats/${router.query.id}` : null, { refreshInterval: 1000, revalidateOnFocus: false });
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(chatData?.chat?.productId ? `/api/products/${chatData?.chat?.productId}` : null);

  // mutation data
  const [uploadChatMessage, { loading: loadingChatMessage }] = useMutation<PostChatsDetailResponse>(`/api/chats/${router.query.id}`, {
    onSuccess: async () => {
      await mutateChat();
      window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
    },
  });
  const [updateProductPurchase, { loading: loadingProductPurchase }] = useMutation<PostProductsPurchaseResponse>(
    chatData?.chat?.productId ? `/api/products/${chatData?.chat?.productId}/purchase` : "",
    {
      onSuccess: async (data) => {
        await mutateProduct();
        router.push(`/products/${data?.recordPurchase?.productId}/review`);
      },
    }
  );
  const [updateProductSale, { loading: loadingProductSale }] = useMutation<PostProductsSaleResponse>(chatData?.chat?.productId ? `/api/products/${chatData?.chat?.productId}/sale` : "", {
    onSuccess: async (data) => {
      if (loadingProductPurchase) return;
      if (!data.recordSale && data.purchaseUserId) updateProductPurchase({ purchase: true, purchaseUserId: data.purchaseUserId });
    },
  });

  // variable: visible
  const formData = useForm<EditChatMessageTypes>({});
  const userGroup = chatData?.chat?.users ? chatData.chat.users.filter((chatUser) => chatUser.id !== user?.id) : [];

  // update: Record.Kind.ProductSale
  const toggleSale = (sale: boolean, purchaseUserId?: number) => {
    if (loadingProductSale || loadingProductPurchase) return;
    updateProductSale({ sale, purchaseUserId });
  };

  // modal: ConfirmSoldProduct
  const openSoldProductModal = () => {
    if (loadingProductSale || loadingProductPurchase) return;
    if (!user || !userGroup.length) return;
    if (!(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "unrelatedUser")) return;
    openModal<AlertModalProps>(AlertModal, "ConfirmSoldProduct", {
      ...(productData?.productCondition?.role?.myRole === "unrelatedUser"
        ? {
            message: `${productData?.product?.user?.name}님에게 '${productData?.product?.name}' 상품을 구매하셨나요?`,
            actions: [
              { key: "cancel", style: AlertStyleEnum["cancel"], text: "취소", handler: null },
              { key: "primary", style: AlertStyleEnum["primary"], text: "구매완료", handler: () => toggleSale(false, user?.id) },
            ],
          }
        : userGroup.length === 1
        ? {
            message: `${userGroup[0].name}님에게 '${productData?.product?.name}' 상품을 판매하셨나요?`,
            actions: [
              { key: "cancel", style: AlertStyleEnum["cancel"], text: "취소", handler: null },
              { key: "primary", style: AlertStyleEnum["primary"], text: "판매완료", handler: () => toggleSale(false, userGroup?.[0]?.id) },
            ],
          }
        : {
            message: `'${productData?.product?.name}' 상품을 판매하셨나요?`,
            actions: [
              { key: "cancel", style: AlertStyleEnum["cancel"], text: "취소", handler: null },
              ...userGroup.map((user) => ({ key: `primary-${user?.id}`, style: AlertStyleEnum["primary"], text: `${user?.name}님에게 판매완료`, handler: () => toggleSale(false, user?.id) })),
            ],
          }),
    });
  };

  // update: ChatMessage
  const submitChatMessage = (data: EditChatMessageTypes) => {
    if (!user || loadingChatMessage) return;
    mutateChat((prev) => {
      const time = new Date();
      const newMessage = { id: time.getTime(), text: data.text, userId: user?.id, chatId: 1, createdAt: time, updatedAt: time };
      return prev && { ...prev, chat: { ...prev.chat, chatMessages: [...prev.chat.chatMessages, { ...newMessage, user }] } };
    }, false);
    uploadChatMessage(data);
    formData.setValue("text", "");
    window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
  };

  if (!chatData?.chat || !chatData?.chat) {
    return <NextError statusCode={500} />;
  }

  return (
    <section className="">
      <h1 className="sr-only">{truncateStr(userGroup.map((chatUser) => chatUser.name).join(", "), 15)} | 채팅</h1>

      {/* 상품 정보 */}
      {productData?.product && (
        <div className="px-5 py-3 bg-gray-200">
          <Link href={`/products/${productData?.product?.id}`}>
            <a className="block">
              <ProductSummary item={productData?.product} {...(productData?.productCondition ? { condition: productData?.productCondition } : {})} />
            </a>
          </Link>
          <div className="empty:hidden mt-2 flex space-x-1">
            {/* 판매완료 */}
            {productData?.productCondition?.role?.myRole === "sellUser" && productData?.productCondition?.isSale && !productData?.productCondition?.isPurchase && (
              <Buttons tag="button" type="button" size="sm" status="default" className="w-auto" onClick={openSoldProductModal}>
                판매완료
              </Buttons>
            )}
            {/* 구매완료 */}
            {productData?.productCondition?.role?.myRole === "unrelatedUser" && productData?.productCondition?.isSale && !productData?.productCondition?.isPurchase && (
              <Buttons tag="button" type="button" size="sm" status="default" className="w-auto" onClick={openSoldProductModal}>
                구매완료
              </Buttons>
            )}
            {/* 거래 후기 보내기 */}
            {(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "purchaseUser") &&
              userGroup.find((user) => productData?.productCondition?.role?.partnerUserId === user?.id) &&
              !productData?.productCondition?.isSale &&
              !productData?.productCondition?.review?.sentReviewId && (
                <Link href={`/products/${productData?.product?.id}/review`} passHref>
                  <Buttons tag="a" size="sm" status="default" className="!inline-block !w-auto !text-left">
                    거래 후기 보내기
                  </Buttons>
                </Link>
              )}
            {/* 보낸 후기 보기 */}
            {(productData?.productCondition?.role?.myRole === "sellUser" || productData?.productCondition?.role?.myRole === "purchaseUser") &&
              userGroup.find((user) => productData?.productCondition?.role?.partnerUserId === user?.id) &&
              !productData?.productCondition?.isSale &&
              productData?.productCondition?.review?.sentReviewId && (
                <Link href={`/reviews/${productData?.productCondition?.review?.sentReviewId}`} passHref>
                  <Buttons tag="a" size="sm" status="default" className="!inline-block !w-auto !text-left">
                    보낸 후기 보기
                  </Buttons>
                </Link>
              )}
          </div>
        </div>
      )}

      {/* 채팅 */}
      <div className="container pb-16">
        {/* 채팅 내역 */}
        <div className="mt-2">
          <ChatMessageList list={chatData.chat.chatMessages} />
        </div>
        {/* 거래 후기 보내기 */}
        {(productData?.productCondition?.role?.partnerUserId === user?.id ||
          (productData?.productCondition?.role?.myRole === "sellUser" && userGroup.find((user) => productData?.productCondition?.role?.partnerUserId === user?.id))) &&
          !productData?.productCondition?.isSale &&
          !productData?.productCondition?.review?.sentReviewId && (
            <div className="mt-4 p-3 bg-orange-100 rounded-md">
              {user?.name}님, 거래 잘 하셨나요?
              <br />
              이웃에게 따뜻한 마음을 전해보세요!
              <Link href={`/products/${productData?.product?.id}/review`} passHref>
                <Buttons tag="a" sort="text-link" status="default">
                  거래 후기 보내기
                </Buttons>
              </Link>
            </div>
          )}
        {/* 채팅 입력 */}
        <div className="fixed-container bottom-0 z-[50]">
          <div className="fixed-inner flex items-center h-14 border-t bg-white">
            <EditChatMessage formData={formData} onValid={submitChatMessage} isLoading={loadingChatMessage} className="w-full px-5" />
          </div>
        </div>
      </div>
    </section>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getChatsDetail: { response: GetChatsDetailResponse };
  getProductsDetail: { response: GetProductsDetailResponse };
}> = ({ getUser, getChatsDetail, getProductsDetail }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          ...(getChatsDetail ? { [`/api/chats/${getChatsDetail.response.chat.id}`]: getChatsDetail.response } : {}),
          ...(getProductsDetail ? { [`/api/products/${getProductsDetail.response.product.id}`]: getProductsDetail.response } : {}),
        },
      }}
    >
      <ChatsDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // chatId
  const chatId: string = params?.id?.toString() || "";

  // invalidUser
  // redirect `/chats`
  if (!ssrUser.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // getChatsDetail
  const { chat } =
    chatId && !isNaN(+chatId)
      ? await getChatsDetail({
          id: +chatId,
          userId: ssrUser?.profile?.id,
        })
      : {
          chat: null,
        };
  if (!chat) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  const userGroup = chat?.users ? chat?.users?.filter((chatUser) => chatUser.id !== ssrUser?.profile?.id) : [];
  const userNames = userGroup?.map((chatUser) => chatUser.name)?.join(", ");

  // getProductsDetail
  const { product, productCondition } =
    chat && chat?.productId
      ? await getProductsDetail({
          id: chat?.productId,
          userId: ssrUser?.profile?.id,
        })
      : {
          product: null,
          productCondition: null,
        };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(userNames, 15)} | 채팅`,
    },
    header: {
      title: truncateStr(userNames, 15),
      titleTag: "strong",
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getChatsDetail: {
        response: {
          success: true,
          chat: JSON.parse(JSON.stringify(chat || {})),
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
      getProductsDetail: {
        response: {
          success: true,
          product: JSON.parse(JSON.stringify(product || {})),
          productCondition: JSON.parse(JSON.stringify(productCondition || {})),
        },
      },
    },
  };
});

export default Page;
