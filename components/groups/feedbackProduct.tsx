// @components
import { ProductItem } from "@components/cards/product";

interface FeedbackProductProps {
  item: ProductItem;
  resumeItem: (item: ProductItem) => void;
  soldItem: (item: ProductItem) => void;
  reviewItem: (item: ProductItem) => void;
}

const FeedbackProduct = ({ item, resumeItem, soldItem, reviewItem }: FeedbackProductProps) => {
  const isSale = item?.records && Boolean(item?.records?.find((record) => record.kind === "Sale"));
  const isSold = item?.records && !isSale;

  return (
    <div className="flex border-t divide-x empty:pt-9">
      {isSale && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => resumeItem(item)}>
          끌어올리기
        </button>
      )}
      {isSale && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => soldItem(item)}>
          판매완료
        </button>
      )}
      {isSold && (
        <button type="button" className="basis-full py-2 text-sm font-semibold" onClick={() => reviewItem(item)}>
          후기 보내기 or 보낸 후기 보기
        </button>
      )}
    </div>
  );
};

export default FeedbackProduct;
