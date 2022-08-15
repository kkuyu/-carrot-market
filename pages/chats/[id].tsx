import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import { Kind } from "@prisma/client";
// @libs
import { truncateStr } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import client from "@libs/server/client";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetChatsDetailResponse } from "@api/chats/[id]";
import { PostChatsMessageResponse } from "@api/chats/[id]/message";
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
  const { user, type: userType } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();

  // fetch data: chat detail
  const { data, error, mutate: boundMutate } = useSWR<GetChatsDetailResponse>(router.query.id ? `/api/chats/${router.query.id}` : null, { refreshInterval: 1000, revalidateOnFocus: false });
  const chatUsers = data?.chat?.users ? data.chat.users.filter((chatUser) => chatUser.id !== user?.id) : [];

  const role = user?.id === data?.chat?.product?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = data?.chat?.product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = data?.chat?.product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = data?.chat?.product?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const [updatePurchase, { loading: updatePurchaseLoading }] = useMutation<PostProductsPurchaseResponse>(data?.chat?.product?.id ? `/api/products/${data.chat.product.id}/purchase` : "", {
    onSuccess: (data) => {
      router.push(`/products/${data?.recordPurchase?.productId}/review`);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(data?.chat?.product?.id ? `/api/products/${data.chat.product.id}/sale` : "", {
    onSuccess: (data) => {
      if (updatePurchaseLoading) return;
      const purchaseUserId = role === "sellUser" ? chatUsers[0].id : user?.id;
      updatePurchase({ purchase: true, purchaseUserId });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // chat message form
  const formData = useForm<EditChatMessageTypes>({});
  const [uploadChatMessage, { loading: uploadLoading }] = useMutation<PostChatsMessageResponse>(`/api/chats/${router.query.id}/message`, {
    onSuccess: (data) => {
      boundMutate();
      window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const toggleSale = () => {
    if (saleLoading) return;
    if (updatePurchaseLoading) return;
    updateSale({ sale: !Boolean(saleRecord) });
  };

  const openSoldProductModal = () => {
    if (saleLoading) return;
    if (updatePurchaseLoading) return;
    openModal<AlertModalProps>(AlertModal, "ConfirmSoldProduct", {
      message:
        role === "sellUser"
          ? `${data?.chat?.product?.user.name}님에게 '${chatUsers[0].name}' 상품을 판매하셨나요?`
          : `${data?.chat?.product?.name}님에게 '${data?.chat?.product?.name}' 상품을 구매하셨나요?`,
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: null,
        },
        {
          key: "primary",
          style: AlertStyleEnum["primary"],
          text: role === "sellUser" ? "판매완료" : "구매완료",
          handler: () => toggleSale(),
        },
      ],
    });
  };

  const submitChatMessage = (data: EditChatMessageTypes) => {
    if (!user || uploadLoading) return;
    boundMutate((prev) => {
      const time = new Date();
      const newMessage = { id: time.getTime(), text: data.text, userId: user?.id, chatId: 1, createdAt: time, updatedAt: time };
      return prev && { ...prev, chat: { ...prev.chat, chatMessages: [...prev.chat.chatMessages, { ...newMessage, user: { id: user?.id, name: user?.name, avatar: "" } }] } };
    }, false);
    uploadChatMessage(data);
    formData.setValue("text", "");
    window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!data) return null;

  return (
    <section className="container pb-16">
      <h1 className="sr-only">{truncateStr(chatUsers.map((chatUser) => chatUser.name).join(", "), 15)} | 채팅</h1>

      {/* 상품 정보 */}
      {data.chat.product && (
        <div className="-mx-5 sticky top-12 left-0 block py-3 px-5 bg-gray-200">
          <Link href={`/products/${data.chat.product.id}`}>
            <a>
              <ProductSummary item={data.chat.product} />
            </a>
          </Link>
          <div className="empty:hidden mt-2">
            {/* 판매완료, 구매완료 */}
            {saleRecord && (
              <Buttons
                tag="button"
                type="button"
                text={role === "sellUser" ? "판매완료" : "구매완료"}
                size="sm"
                status="default"
                className="!inline-block !w-auto !text-left"
                onClick={openSoldProductModal}
              />
            )}
            {/* 거래 후기 보내기 */}
            {!saleRecord && purchaseRecord && !existedReview && data?.chat.users.find((chatUser) => chatUser.id === purchaseRecord?.userId) && (
              <Link href={`/products/${data?.chat?.product?.id}/review`} passHref>
                <Buttons tag="a" text="거래 후기 보내기" size="sm" status="default" className="!inline-block !w-auto !text-left" />
              </Link>
            )}
            {/* 보낸 후기 보기 */}
            {!saleRecord && purchaseRecord && existedReview && data?.chat.users.find((chatUser) => chatUser.id === existedReview?.[`${role === "sellUser" ? "purchaseUser" : "sellUser"}Id`]) && (
              <Link href={`/reviews/${existedReview.id}`} passHref>
                <Buttons tag="a" text="보낸 후기 보기" size="sm" status="default" className="!inline-block !w-auto !text-left" />
              </Link>
            )}
          </div>
        </div>
      )}
      {/* 채팅 목록 */}
      <div className="mt-2">
        <ChatMessageList list={data.chat.chatMessages} />
      </div>
      {/* 거래 후기 보내기 */}
      {!saleRecord && purchaseRecord && !existedReview && data?.chat.users.find((chatUser) => chatUser.id === purchaseRecord?.userId) && (
        <div className="mt-4 p-3 bg-orange-100 rounded-md">
          {user?.name}님, 거래 잘 하셨나요?
          <br />
          이웃에게 따뜻한 마음을 전해보세요!
          <Link href={`/products/${data?.chat?.product?.id}/review`} passHref>
            <Buttons tag="a" sort="text-link" status="default" text="거래 후기 보내기" />
          </Link>
        </div>
      )}
      {/* 채팅 입력 */}
      <div className="fixed-container bottom-0 z-[50]">
        <div className="fixed-inner flex items-center h-14 border-t bg-white">
          <EditChatMessage formData={formData} onValid={submitChatMessage} isLoading={uploadLoading} className="w-full px-5" />
        </div>
      </div>
    </section>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getChat: { response: GetChatsDetailResponse };
}> = ({ getUser, getChat }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/chats/${getChat.response.chat.id}`]: getChat.response,
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
  const ssrUser = await getSsrUser(req);

  // chatId
  const chatId: string = params?.id?.toString() || "";

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/chats`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // invalidUrl
  let invalidUrl = false;
  if (!chatId || isNaN(+chatId)) invalidUrl = true;
  // redirect `/chats`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // getChat
  const chat = await client.chat.findUnique({
    where: {
      id: +chatId,
    },
    include: {
      chatMessages: {
        orderBy: {
          updatedAt: "asc",
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
      },
      users: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      product: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          records: {
            where: {
              OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductPurchase }],
            },
            select: {
              id: true,
              kind: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  // invalidChat
  let invalidChat = false;
  if (!chat) invalidChat = true;
  if (!chat?.users.find((chatUser) => chatUser.id === ssrUser?.profile?.id)) invalidChat = true;
  // redirect `/chats`
  if (invalidChat) {
    return {
      redirect: {
        permanent: false,
        destination: `/chats`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${truncateStr(
        chat?.users
          ?.filter((chatUser) => chatUser.id !== ssrUser?.profile?.id)
          ?.map((chatUser) => chatUser.name)
          ?.join(", "),
        15
      )} | 채팅`,
    },
    header: {
      title: truncateStr(
        chat?.users
          ?.filter((chatUser) => chatUser.id !== ssrUser?.profile?.id)
          ?.map((chatUser) => chatUser.name)
          ?.join(", "),
        15
      ),
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
      getChat: {
        response: {
          success: true,
          chat: JSON.parse(JSON.stringify(chat || {})),
        },
      },
    },
  };
});

export default Page;
