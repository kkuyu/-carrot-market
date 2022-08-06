import { useRouter } from "next/router";
import React from "react";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";

export type FeedbackProductItem = GetProfilesProductsResponse["products"][0];

export interface FeedbackProductProps {
  item?: FeedbackProductItem;
}

const FeedbackProduct = ({ item }: FeedbackProductProps) => {
  const router = useRouter();
  const { user } = useUser();

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
  const purchaseRecord = item?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existsReview = item?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const toggleSale = (value: boolean) => {
    if (!item) return;
    if (saleLoading) return;
    updateSale({ sale: value });
  };

  const clickReview = () => {
    if (!item) return;
    router.push(existsReview ? `/reviews/${existsReview?.id}` : purchaseRecord ? `/products/${item.id}/review` : `/products/${item.id}/purchase`);
  };

  if (!item) return null;

  return (
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
          거래 후기 보내기
        </button>
      )}
      {!saleRecord && existsReview && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={clickReview} disabled={saleLoading}>
          보낸 후기 보기
        </button>
      )}
    </div>
  );
};

export default React.memo(FeedbackProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  return true;
});
