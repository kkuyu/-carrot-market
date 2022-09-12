import { useRouter } from "next/router";
import { memo } from "react";
import type { HTMLAttributes } from "react";
import useSWR from "swr";
// @libs
import { getProductCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
import { GetProfilesDetailProductsResponse } from "@api/profiles/[id]/products/[filter]";
// @components
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import Buttons, { ButtonsProps } from "@components/buttons";
import Icons from "@components/icons";

export type HandleProductItem = GetProfilesDetailProductsResponse["products"][number];

export interface HandleProductProps extends HTMLAttributes<HTMLButtonElement> {
  item?: HandleProductItem;
  size?: ButtonsProps<"button">["size"];
}

const HandleProduct = (props: HandleProductProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();
  const { openModal } = useModal();

  // fetch data
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null, {
    ...(item ? { fallbackData: { success: true, product: item, productCondition: getProductCondition(item, user?.id) } } : {}),
  });

  // mutation data
  const [updateProductSale, { loading: loadingProductSale }] = useMutation<PostProductsSaleResponse>(item?.id ? `/api/products/${item.id}/sale` : "", {
    onSuccess: async (data) => {
      await mutateProduct();
      if (!data.recordSale) await router.push(`/products/${item?.id}/purchase/available`);
      if (data.recordSale) await router.push(`/products/${item?.id}`);
    },
  });

  // update: Record.Kind.ProductSale
  const toggleSale = (sale: boolean) => {
    if (loadingProductSale) return;
    if (!productData?.product) return;
    updateProductSale({ sale });
  };

  // modal: ConfirmSoldToSale
  const openSaleModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmSoldToSale", {
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
          handler: () => toggleSale(true),
        },
      ],
    });
  };

  if (!productData?.product) return null;

  return (
    <Buttons
      tag="button"
      type="button"
      sort="icon-block"
      size="sm"
      status="unset"
      onClick={() => {
        const modalActions = [
          { key: "sale", style: ActionStyleEnum["default"], text: "판매중", handler: () => (productData?.product?.reviews?.length ? openSaleModal() : toggleSale(true)) },
          { key: "sold", style: ActionStyleEnum["default"], text: "판매완료", handler: () => toggleSale(false) },
          { key: "update", style: ActionStyleEnum["default"], text: "수정", handler: () => router.push(`/products/${productData?.product?.id}/edit`) },
          { key: "delete", style: ActionStyleEnum["destructive"], text: "삭제", handler: () => router.push(`/products/${productData?.product?.id}/delete`) },
          { key: "cancel", style: ActionStyleEnum["cancel"], text: "취소", handler: null },
        ];
        openModal<ActionModalProps>(ActionModal, "HandleProduct", {
          actions: productData?.productCondition?.isSale
            ? modalActions.filter((action) => ["sold", "update", "delete", "cancel"].includes(action.key))
            : modalActions.filter((action) => ["sale", "update", "delete", "cancel"].includes(action.key)),
        });
      }}
      disabled={loadingProductSale}
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
