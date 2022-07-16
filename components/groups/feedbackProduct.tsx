// @components
import { ProductItem } from "@components/cards/product";

interface FeedbackProductProps {
  item: ProductItem;
  resumeItem: (item: ProductItem) => void;
  soldItem: (item: ProductItem) => void;
  reviewItem: (item: ProductItem) => void;
  isLoading?: boolean;
}

const FeedbackProduct = ({ item, resumeItem, soldItem, reviewItem, isLoading = false }: FeedbackProductProps) => {
  const isSale = item?.records && Boolean(item?.records?.find((record) => record.kind === "Sale"));
  const isSold = item?.records && !isSale;

  return (
    <div className="flex border-t divide-x empty:pt-9">
      {isSale && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => resumeItem(item)} disabled={isLoading}>
          끌어올리기
        </button>
      )}
      {isSale && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => soldItem(item)} disabled={isLoading}>
          판매완료
        </button>
      )}
      {isSold && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => reviewItem(item)} disabled={isLoading}>
          후기 보내기 or 보낸 후기 보기
        </button>
      )}
    </div>
  );
};

export default FeedbackProduct;
