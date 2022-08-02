import { useRouter } from "next/router";
import React from "react";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProfilesProductsResponse } from "@api/users/profiles/[id]/products";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";

export type HandleProductItem = GetProfilesProductsResponse["products"][0];

export interface HandleProductProps extends React.HTMLAttributes<HTMLButtonElement> {
  item?: HandleProductItem;
}

const HandleProduct = ({ item, className }: HandleProductProps) => {
  const router = useRouter();
  const { user } = useUser();

  const { openModal } = useModal();
  const { openPanel } = usePanel();

  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(item?.id ? `/api/products/${item.id}/sale` : "", {
    onSuccess: (data) => {
      if (!data.recordSale) {
        router.push(`/products/${item?.id}/purchase`);
      } else {
        router.push(`/products/${item?.id}`);
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

  if (!item) return null;

  const role = user?.id === item?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = item?.records?.find((record) => record.kind === Kind.ProductSale);

  const toggleSale = (value: boolean) => {
    if (saleLoading) return;
    updateSale({ sale: value });
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
            { key: "sale", text: "판매중", onClick: () => (item?.reviews?.length ? openSaleModal() : toggleSale(true)) },
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
    <button type="button" className={`absolute top-0 right-0 ${className}`} onClick={openOthersPanel} disabled={saleLoading}>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
    </button>
  );
};

export default React.memo(HandleProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  return true;
});
