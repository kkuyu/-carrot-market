import Image from "next/image";

import { useEffect, useRef, useState } from "react";

import Flicking, { ViewportSlot } from "@egjs/react-flicking";
import "@egjs/react-flicking/dist/flicking.min.css";
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
  defaultIndex: number;
  modal: null | {
    title: string;
  };
}

const Thumbnails = ({ list, defaultIndex, modal }: ThumbnailsProps) => {
  const { openModal } = useModal();
  const [mounted, setMounted] = useState(false);

  // slider
  const flickingRef = useRef<Flicking>(null);
  const [flickingIndex, setFlickingIndex] = useState(defaultIndex);

  const updateSlider = () => {
    if (list.length <= 1) return;

    if (!flickingRef) return;
    if (!flickingRef?.current) return;
    if (flickingRef?.current?.initialized) return;

    setFlickingIndex(defaultIndex);
    flickingRef.current.init();
    flickingRef.current.viewport.element.setAttribute("aria-roledescription", "carousel");
    flickingRef.current.camera.element.setAttribute("aria-live", 'polite"');
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

  useEffect(() => {
    setTimeout(() => {
      if (!mounted) return;
      updateSlider();
    }, 0);
  }, [list]);

  useEffect(() => {
    setMounted(true);
    updateSlider();
  }, []);

  if (!list.length) {
    return null;
  }

  if (list.length === 1) {
    return (
      <div className="relative block w-full">
        {modal ? (
          <button type="button" className="relative block w-full bg-slate-300" onClick={() => openThumbnailModal(list, 0)}>
            <span className="block pb-[80%]"></span>
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${list[0].src}/public`} alt={list[0].name} layout="fill" objectFit="cover" />
          </button>
        ) : (
          <span className="relative block w-full bg-slate-300">
            <span className="block pb-[80%]"></span>
            <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${list[0].src}/public`} alt={list[0].name} layout="fill" objectFit="cover" />
          </span>
        )}
      </div>
    );
  }

  return (
    <Flicking
      ref={flickingRef}
      cameraTag="ul"
      align="prev"
      panelsPerView={1}
      defaultIndex={defaultIndex}
      autoInit={false}
      moveType="strict"
      onChanged={(e) => {
        setFlickingIndex(e.index);
      }}
      onPanelChange={(e) => {
        setFlickingIndex(defaultIndex);
        flickingRef.current?.moveTo(defaultIndex, 0);
      }}
      style={{ width: "100%" }}
    >
      {list.map((item, index) => (
        <li key={item.key} id={item.key} role="tabpanel" className="relative block w-full panel" aria-roledescription="slide" aria-label={item.label} aria-hidden={item.index === flickingIndex}>
          {modal ? (
            <button type="button" className="relative block w-full bg-slate-300" onClick={() => openThumbnailModal(list, index)}>
              <span className="block pb-[80%]"></span>
              <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${item.src}/public`} alt={item.name} layout="fill" objectFit="cover" />
            </button>
          ) : (
            <span className="relative block w-full bg-slate-300">
              <span className="block pb-[80%]"></span>
              <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${item.src}/public`} alt={item.name} layout="fill" objectFit="cover" />
            </span>
          )}
        </li>
      ))}
      <ViewportSlot>
        <div role="tablist" className="absolute bottom-2 left-0 flex justify-center w-full z-[1]">
          {list.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              className="w-4 h-4 p-1"
              onClick={() => {
                flickingRef.current?.moveTo(item.index);
              }}
              aria-label={item.label}
              aria-controls={item.key}
              aria-selected={item.index === flickingIndex}
            >
              <span className={`block w-2 h-2 bg-white rounded-md ${item.index === flickingIndex ? "opacity-100" : "opacity-20"}`} />
            </button>
          ))}
        </div>
      </ViewportSlot>
    </Flicking>
  );
};

export default Thumbnails;
