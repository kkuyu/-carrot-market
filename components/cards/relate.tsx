// @api
import { GetProductsDetailOthersResponse } from "@api/products/[id]/others";
// @components
import Images from "@components/images";

export type RelateItem = GetProductsDetailOthersResponse["otherProducts"][0];

interface RelateProps {
  item: RelateItem;
}

const Relate = ({ item }: RelateProps) => {
  if (!item) return null;

  const thumbnailId = item?.photos ? item.photos.split(",")[0] : "";

  return (
    <div className="relative">
      <div className="">
        <Images size="100%" ratioX={16} ratioY={9} cloudId={thumbnailId} cloudVariant="public" rounded="md" alt="" />
      </div>
      <div className="mt-2">
        <strong className="block font-normal">{item?.name}</strong>
        <span className="block text-sm font-semibold">₩{item?.price}</span>
      </div>
    </div>
  );
};

export default Relate;
