import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import { getProductCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsLikeResponse } from "@api/products/[id]/like";
// @components
import WelcomeAlertModal, { WelcomeAlertModalProps, WelcomeAlertModalName } from "@components/commons/modals/instance/welcomeAlertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export type LikeProductItem = GetProfilesProductsResponse["products"][number];

export interface LikeProductProps extends HTMLAttributes<HTMLButtonElement> {
  item?: LikeProductItem;
}

const LikeProduct = (props: LikeProductProps) => {
  const { item, className = "", ...restProps } = props;
  const { user, type: userType } = useUser();
  const { openModal } = useModal();

  // fetch data
  const { data: productData, mutate: mutateProduct } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null, {
    ...(item ? { fallbackData: { success: true, product: item, productCondition: getProductCondition(item, user?.id) } } : {}),
  });

  // mutation data
  const [updateProductLike, { loading: loadingProductLike }] = useMutation<PostProductsLikeResponse>(`/api/products/${item?.id}/like`, {
    onSuccess: async () => {
      await mutateProduct();
    },
  });

  // update: record like
  const toggleLike = () => {
    if (!productData?.product) return;
    if (loadingProductLike) return;
    const currentCondition = productData?.productCondition ?? getProductCondition(productData?.product!, user?.id);
    mutateProduct((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      if (currentCondition?.isLike) records = records.filter((record) => record.kind !== Kind.ProductLike && record.userId !== user?.id);
      if (!currentCondition?.isLike) records = [...records, { id: 0, kind: Kind.ProductSale, userId: user?.id! }];
      return prev && { ...prev, product: { ...prev.product, records }, productCondition: getProductCondition({ ...productData?.product, records }, user?.id) };
    }, false);
    updateProductLike({ like: !currentCondition?.isLike });
  };

  if (!item) return null;

  return (
    <Buttons
      type="button"
      tag="button"
      sort="icon-block"
      size="base"
      status="default"
      className={`${className}`}
      onClick={() => {
        if (userType === "member") toggleLike();
        if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
        if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
      }}
      disabled={loadingProductLike}
      {...restProps}
      aria-label={`관심상품 ${productData?.productCondition?.isLike ? "취소" : "추가"}`}
    >
      {productData?.productCondition?.isLike ? <Icons name="HeartSolid" className="w-6 h-6 text-gray-600" /> : <Icons name="Heart" className="w-6 h-6" />}
    </Buttons>
  );
};

export default memo(LikeProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
