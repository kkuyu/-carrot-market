import Image from "next/image";

import useModal from "@libs/client/useModal";

import { ThumbnailSlider } from "@components/sliders";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";

export interface ThumbnailItem {
  src: string;
  index: number;
  key: string;
  label: string;
  name: string;
}

interface ThumbnailsProps {
  list: ThumbnailItem[];
  modal?: {
    title: string;
  };
}

const Thumbnails = ({ list, modal }: ThumbnailsProps) => {
  const { openModal } = useModal();

  const makeGridItem = (item: ThumbnailItem, index: number, array: ThumbnailItem[]) => {
    let gridItemClass = "";
    if (array.length === 1 && index === 0) gridItemClass = "col-span-2";
    if (array.length === 3 && index === 0) gridItemClass = "row-span-2";

    let imageSize = "80%";
    if (array.length === 1 && index === 0) imageSize = "40%";
    if (array.length === 3 && index !== 0) imageSize = "40%";

    if (!modal) {
      return (
        <span key={item.key} className={`relative block w-full bg-slate-300 ${gridItemClass}`}>
          <span className="block" style={{ paddingBottom: imageSize }}></span>
          <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${item.src}/public`} alt={item.name} layout="fill" objectFit="cover" />
        </span>
      );
    }

    return (
      <button key={item.key} type="button" className={`relative block w-full bg-slate-300 ${gridItemClass}`} onClick={() => openThumbnailModal(list, 0)}>
        <span className="block" style={{ paddingBottom: imageSize }}></span>
        <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${item.src}/public`} alt={item.name} layout="fill" objectFit="cover" />
      </button>
    );
  };

  const openThumbnailModal = (list: ThumbnailItem[], index: number) => {
    if (!modal) return;

    openModal<LayerModalProps>(LayerModal, "thumbnailModal", {
      headerType: "default",
      title: modal.title,
      contents: (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center bg-slate-300">
          <ThumbnailSlider list={list} defaultIndex={index} modal={null} />
        </div>
      ),
    });
  };

  if (!list.length) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      <div className="grid grid-cols-2 gap-1">
        {list.slice(0, 3).map((item, index, array) => makeGridItem(item, index, array))}
        {Boolean(list.length > 3) && (
          <div className="absolute top-1/2 right-0 w-1/2 h-1/2 pt-0.5 pl-0.5 pointer-events-none">
            <span className="flex items-center justify-center w-full h-full bg-black/20" aria-label={`+${list.length - 3}`}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thumbnails;
