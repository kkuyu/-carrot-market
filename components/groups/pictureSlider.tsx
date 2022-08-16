import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import Flicking, { FlickingOptions, FlickingProps, ViewportSlot } from "@egjs/react-flicking";
import "@egjs/react-flicking/dist/flicking.min.css";
// @libs
import { TimerRef, setTimer, clearTimer } from "@libs/utils";
import useModal from "@libs/client/useModal";
// @components
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import PictureZoom from "@components/groups/pictureZoom";
import Images from "@components/images";

export interface PictureSliderItem {
  src: string;
  index: number;
  key: string;
  label: string;
  name: string;
}

interface PictureSliderProps extends Partial<FlickingProps & FlickingOptions> {
  list: PictureSliderItem[];
  defaultIndex: number;
}

const PictureSlider = (props: PictureSliderProps) => {
  const { list, defaultIndex, className = "", ...restProps } = props;
  const { openModal } = useModal();
  const [mounted, setMounted] = useState(false);

  // slider
  const flickingRef = useRef<Flicking>(null);
  const [flickingIndex, setFlickingIndex] = useState(defaultIndex);
  const delayTimer: TimerRef = useRef(null);

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

  const openPictureModal = (list: PictureSliderItem[], index: number) => {
    openModal<LayerModalProps>(LayerModal, "PictureZoom", {
      headerType: "transparent",
      closeBtnColor: "white",
      children: (
        <div className="absolute top-0 left-0 right-0 bottom-0">
          <PictureZoom list={list} defaultIndex={index} />
        </div>
      ),
    });
  };

  const SliderItem = (itemProps: { item: PictureSliderItem; index: number; array: PictureSliderItem[] } & HTMLAttributes<HTMLButtonElement>) => {
    const { item, index, array, className: itemClassName = "" } = itemProps;
    return (
      <button
        type="button"
        className={`relative block w-full bg-slate-300 ${itemClassName}`}
        onClick={() => {
          openPictureModal(list, index);
        }}
        onFocus={() => {
          if (!flickingRef.current) return;
          flickingRef.current.viewport.element.scrollLeft = 0;
          flickingRef.current.moveTo(index, 0);
        }}
      >
        <Images cloudId={item.src} cloudVariant="public" size="100%" ratioX={5} ratioY={3} rounded="none" alt={item.name} />
      </button>
    );
  };

  useEffect(() => {
    const updateList = async () => {
      await setTimer(delayTimer, 0);
    };
    clearTimer(delayTimer);
    updateList();
  }, [list]);

  useEffect(() => {
    setMounted(true);
    updateSlider();
  }, []);

  if (!list.length) return null;

  if (list.length === 1) {
    return (
      <div className="relative block w-full">
        <SliderItem item={list[0]} index={0} array={list} />
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
      className={`${className}`}
      {...restProps}
    >
      {list.map((item, index, array) => (
        <li key={item.key} id={item.key} role="tabpanel" className="aaa relative block w-full panel" aria-roledescription="slide" aria-label={item.label}>
          <SliderItem item={item} index={index} array={array} />
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
              onClick={() => flickingRef.current?.moveTo(item.index)}
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

export default PictureSlider;
