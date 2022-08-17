import { useRouter } from "next/router";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR from "swr";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";

export type FeedbackProductItem = GetProfilesProductsResponse["products"][0];

export interface FeedbackProductProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackProductItem;
}

const FeedbackProduct = (props: FeedbackProductProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();

  const { data, mutate: boundMutate } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null);
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
  const saleRecord = data?.product?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = data?.product?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existedReview = data?.product?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

  const toggleSale = () => {
    if (!item) return;
    if (saleLoading) return;
    updateSale({ sale: !Boolean(saleRecord) });
  };

  const clickReview = () => {
    if (!item) return;
    router.push(existedReview ? `/reviews/${existedReview?.id}` : purchaseRecord ? `/products/${item.id}/review` : `/products/${item.id}/purchase`);
  };

  if (!item) return null;

  return (
    <div className={`empty:pt-9 flex border-t divide-x ${className}`} {...restProps}>
      {data && saleRecord && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => router.push(`/products/${item?.id}/resume`)} disabled={saleLoading}>
          끌어올리기
        </button>
      )}
      {data && saleRecord && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={toggleSale} disabled={saleLoading}>
          판매완료
        </button>
      )}
      {data && !saleRecord && !existedReview && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={clickReview} disabled={saleLoading}>
          거래 후기 보내기
        </button>
      )}
      {data && !saleRecord && existedReview && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={clickReview} disabled={saleLoading}>
          보낸 후기 보기
        </button>
      )}
    </div>
  );
};

export default memo(FeedbackProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
