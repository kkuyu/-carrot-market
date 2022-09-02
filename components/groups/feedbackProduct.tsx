import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import useSWR from "swr";
// @libs
import { getProductCondition } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
// @api
import { GetProductsDetailResponse } from "@api/products/[id]";
import { GetProfilesProductsResponse } from "@api/profiles/[id]/products/[filter]";
import { PostProductsSaleResponse } from "@api/products/[id]/sale";
// @components
import Buttons from "@components/buttons";

export type FeedbackProductItem = GetProfilesProductsResponse["products"][number];

export interface FeedbackProductProps extends HTMLAttributes<HTMLDivElement> {
  item?: FeedbackProductItem;
}

const FeedbackProduct = (props: FeedbackProductProps) => {
  const { item, className = "", ...restProps } = props;
  const router = useRouter();
  const { user } = useUser();

  // fetch data
  const { data: productData, mutate: productMutate } = useSWR<GetProductsDetailResponse>(item?.id ? `/api/products/${item.id}` : null, {
    ...(item ? { fallbackData: { success: true, product: item, productCondition: getProductCondition(item, user?.id) } } : {}),
  });

  // mutation data
  const [updateSale, { loading: saleLoading }] = useMutation<PostProductsSaleResponse>(item?.id ? `/api/products/${item.id}/sale` : "", {
    onSuccess: async (data) => {
      if (!data.recordSale) {
        await productMutate();
        router.push(`/products/${item?.id}/purchase`);
      } else {
        router.push(`/products/${item?.id}`);
      }
    },
  });

  // update: record sale
  const toggleSale = () => {
    if (!productData?.product) return;
    if (saleLoading) return;
    updateSale({ sale: !productData?.productCondition?.isSale });
  };

  if (!productData?.product) return null;

  const CustomFeedbackButton = (buttonProps: { pathname?: string; disabled?: boolean; children: string } & HTMLAttributes<HTMLButtonElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="text-link" size="sm" status="unset" onClick={onClick} className={`basis-full py-2 font-semibold text-center ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="text-link" size="sm" status="unset" className={`basis-full py-2 font-semibold text-center ${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  return (
    <div className={`empty:pt-9 flex border-t divide-x ${className}`} {...restProps}>
      {productData?.product && productData?.productCondition?.isSale && (
        <>
          <CustomFeedbackButton onClick={() => router.push(`/products/${productData?.product?.id}/resume`)} disabled={saleLoading}>
            끌어올리기
          </CustomFeedbackButton>
          <CustomFeedbackButton onClick={toggleSale} disabled={saleLoading}>
            판매완료
          </CustomFeedbackButton>
        </>
      )}
      {productData?.product && !productData?.productCondition?.isSale && (
        <>
          {Boolean(productData?.productCondition?.review?.sentReviewId) ? (
            <CustomFeedbackButton pathname={`/reviews/${productData?.productCondition?.review?.sentReviewId}`}>보낸 후기 보기</CustomFeedbackButton>
          ) : Boolean(productData?.productCondition?.isPurchase) ? (
            <CustomFeedbackButton pathname={`/products/${productData?.product?.id}/review`}>거래 후기 보내기</CustomFeedbackButton>
          ) : (
            <CustomFeedbackButton pathname={`/products/${productData?.product?.id}/purchase`}>거래 후기 보내기</CustomFeedbackButton>
          )}
        </>
      )}
    </div>
  );
};

export default memo(FeedbackProduct, (prev, next) => {
  if (prev?.item?.id !== next?.item?.id) return false;
  if (prev?.item?.updatedAt !== next?.item?.updatedAt) return false;
  return true;
});
