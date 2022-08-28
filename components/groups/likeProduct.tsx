import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
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

  const { data, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null);
  const [updateLike, { loading: likeLoading }] = useMutation<PostProductsLikeResponse>(`/api/products/${item?.id}/like`, {
    onSuccess: (data) => {
      boundMutate();
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
  const likeRecord = data?.product?.records?.find((record) => record.userId === user?.id && record.kind === Kind.ProductLike);

  // like
  const clickLike = () => {
    if (userType === "member") toggleLike();
    if (userType === "non-member") openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
    if (userType === "guest") openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, {});
  };
  const toggleLike = () => {
    if (!data?.product) return;
    if (likeLoading) return;
    const isLike = !Boolean(likeRecord);
    boundMutate((prev) => {
      let records = prev?.product?.records ? [...prev.product.records] : [];
      const idx = records.findIndex((record) => record.id === likeRecord?.id);
      if (!isLike) records.splice(idx, 1);
      if (isLike) records.push({ id: 0, kind: Kind.ProductLike, userId: user?.id! });
      return prev && { ...prev, product: { ...prev.product, records } };
    }, false);
    updateLike({});
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
      onClick={clickLike}
      disabled={likeLoading}
      {...restProps}
      aria-label={`관심상품 ${likeRecord ? "취소" : "추가"}`}
    >
      {likeRecord ? <Icons name="HeartSolid" className="w-6 h-6 text-gray-600" /> : <Icons name="Heart" className="w-6 h-6" />}
    </Buttons>
  );
};

export default memo(LikeProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
