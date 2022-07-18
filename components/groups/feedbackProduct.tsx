import { useRouter } from "next/router";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProfilesProductsResponse } from "@api/users/profiles/products";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";

export type FeedbackProductItem = GetProfilesProductsResponse["products"][0];

export interface FeedbackProductProps {
  item: FeedbackProductItem;
}

const FeedbackProduct = ({ item }: FeedbackProductProps) => {
  const router = useRouter();
  const { user } = useUser();

  const { openModal } = useModal();
  const { openPanel } = usePanel();

  const role = user?.id === item?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = item?.records?.find((record) => record.kind === Kind.Sale);
  const purchaseRecord = item?.records?.find((record) => record.kind === Kind.Purchase);
  const existsReview = item?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(`/api/products/${item.id}/sale`, {
    onSuccess: (data) => {
      if (!data.recordSale) {
        router.push(`/products/${item.id}/purchase`);
      } else {
        router.push(`/products/${item.id}`);
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

  const toggleSale = (value: boolean) => {
    if (saleLoading) return;
    updateSale({ sale: value });
  };

  const clickReview = () => {
    if (!existsReview && !purchaseRecord) {
      router.push(`/products/${item.id}/purchase`);
      return;
    }
    if (!existsReview && purchaseRecord) {
      router.push(`/products/${item.id}/review`);
      return;
    }
    router.push(`/reviews/${existsReview?.id}`);
  };

  const openOthersPanel = () => {
    openPanel<ActionPanelProps>(ActionPanel, "others", {
      hasBackdrop: true,
      actions: saleRecord
        ? [
            { key: "update", text: "수정", onClick: () => router.push(`/products/${item.id}/edit`) },
            { key: "delete", text: "삭제", onClick: () => router.push(`/products/${item.id}/delete`) },
          ]
        : [
            { key: "sale", text: "판매중", onClick: () => (existsReview ? openSaleModal() : toggleSale(true)) },
            { key: "update", text: "수정", onClick: () => router.push(`/products/${item.id}/edit`) },
            { key: "delete", text: "삭제", onClick: () => router.push(`/products/${item.id}/delete`) },
          ],
      cancelBtn: "닫기",
    });
  };

  const openSaleModal = () => {
    openModal<MessageModalProps>(MessageModal, "sale", {
      type: "confirm",
      hasBackdrop: true,
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요. 그래도 변경하시겠어요?",
      confirmBtn: "변경",
      onConfirm: () => toggleSale(true),
    });
  };

  return (
    <>
      <div className="flex border-t divide-x empty:pt-9">
        {saleRecord && (
          <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => router.push(`/products/${item?.id}/resume`)} disabled={saleLoading}>
            끌어올리기
          </button>
        )}
        {saleRecord && (
          <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => toggleSale(false)} disabled={saleLoading}>
            판매완료
          </button>
        )}
        {!saleRecord && !existsReview && (
          <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={clickReview} disabled={saleLoading}>
            후기 보내기
          </button>
        )}
        {!saleRecord && existsReview && (
          <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={clickReview} disabled={saleLoading}>
            보낸 후기 보기
          </button>
        )}
      </div>
      <button type="button" className="absolute top-0 right-0 p-3" onClick={openOthersPanel} disabled={saleLoading}>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </>
  );
};

export default FeedbackProduct;
