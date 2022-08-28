import { useRouter } from "next/router";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
// @components
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import Buttons, { ButtonsProps } from "@components/buttons";
import Icons from "@components/icons";

export type HandleProductItem = GetProfilesProductsResponse["products"][number];

export interface HandleProductProps extends HTMLAttributes<HTMLButtonElement> {
  item?: HandleProductItem;
  size?: ButtonsProps<"button">["size"];
}

const HandleProduct = (props: HandleProductProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();
  const { openModal } = useModal();

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

  const role = user?.id === item?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = item?.records?.find((record) => record.kind === Kind.ProductSale);

  const toggleSale = () => {
    if (saleLoading) return;
    updateSale({ sale: !Boolean(saleRecord) });
  };

  const openSaleModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmSaleToSold", {
      message: "판매중으로 변경하면 서로 주고받은 거래후기가 취소돼요. 그래도 변경하시겠어요?",
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

  if (!item) return null;

  return (
    <Buttons
      tag="button"
      type="button"
      sort="icon-block"
      size="sm"
      status="unset"
      onClick={() => {
        const modalActions = [
          { key: "sale", style: ActionStyleEnum["primary"], text: "판매중", handler: () => (item?.reviews?.length ? openSaleModal() : toggleSale()) },
          { key: "update", style: ActionStyleEnum["default"], text: "수정", handler: () => router.push(`/products/${item?.id}/edit`) },
          { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => router.push(`/products/${item?.id}/delete`) },
          { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
        ];
        openModal<ActionModalProps>(ActionModal, "HandleProduct", {
          actions: saleRecord
            ? modalActions.filter((action) => ["update", "delete", "cancel"].includes(action.key))
            : modalActions.filter((action) => ["sale", "update", "delete", "cancel"].includes(action.key)),
        });
      }}
      disabled={saleLoading}
      className={`absolute top-0 right-0 ${className}`}
      {...restProps}
      aria-label="옵션 더보기"
    >
      <Icons name="EllipsisVertical" className="w-5 h-5 text-gray-400" />
    </Buttons>
  );
};

export default memo(HandleProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  return true;
});
