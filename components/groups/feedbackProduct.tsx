import { useRouter } from "next/router";
import { Kind } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProfilesProductsResponse } from "@api/users/profiles/[id]/products";
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

  if (!item) return null;

  const role = user?.id === item?.userId ? "sellUser" : "purchaseUser";
  const saleRecord = item?.records?.find((record) => record.kind === Kind.ProductSale);
  const purchaseRecord = item?.records?.find((record) => record.kind === Kind.ProductPurchase);
  const existsReview = item?.reviews?.find((review) => review.role === role && review[`${role}Id`] === user?.id);

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

export default FeedbackProduct;
