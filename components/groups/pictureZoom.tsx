import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { ReactZoomPanPinchRef, TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Flicking from "@egjs/react-flicking";
import "@egjs/react-flicking/dist/flicking.min.css";
// @components
import Images from "@components/images";

export interface PictureZoomItem {
  src: string;
  index: number;
  key: string;
  label: string;
  name: string;
}

interface PictureZoomProps extends HTMLAttributes<HTMLDivElement> {
  list: PictureZoomItem[];
  defaultIndex: number;
}

const PictureZoom = (props: PictureZoomProps) => {
  const { list, defaultIndex, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);

  // zoom
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

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
  };

  const resetZoom = () => {
    if (!zoomRef.current) return;
    zoomRef.current.resetTransform();
  };

  const SliderItem = (itemProps: HTMLAttributes<HTMLButtonElement> & { item: PictureZoomItem; index: number; array: PictureZoomItem[] }) => {
    const { className: itemClassName = "", item, index, array } = itemProps;
    return (
      <button
        type="button"
        className={`relative block border-2 rounded-md ${item.index === flickingIndex ? "border-orange-500" : "border-transparent"} ${itemClassName}`}
        onClick={() => {
          if (!flickingRef.current) return;
          flickingRef.current.viewport.element.scrollLeft = 0;
          flickingRef.current.moveTo(index, 200);
          setFlickingIndex(index);
          resetZoom();
        }}
        onFocus={() => {
          if (!flickingRef.current) return;
          flickingRef.current.viewport.element.scrollLeft = 0;
        }}
      >
        <Images cloudId={item.src} cloudVariant="public" size="6rem" rounded="md" alt={item.name} />
      </button>
    );
  };

  useEffect(() => {
    resetZoom();
  }, [flickingIndex]);

  useEffect(() => {
    setTimeout(() => {
      if (!mounted) return;
      updateSlider();
      resetZoom();
    }, 0);
  }, [list]);

  useEffect(() => {
    setMounted(true);
    updateSlider();
    resetZoom();
  }, []);

  if (!list.length) return null;

  return (
    <div className={`relative w-full h-full bg-slate-300 ${className}`} {...restProps}>
      <div id={list[flickingIndex].key} role="tabpanel" aria-label={list[flickingIndex].label} style={{ height: "calc(100% - 8rem)" }}>
        <TransformWrapper
          ref={zoomRef}
          centerOnInit={true}
          onInit={(ref) => {
            const wrapper = ref.instance.wrapperComponent;
            if (wrapper) wrapper.style.opacity = "1";
          }}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => {
            return (
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%", opacity: 0, transition: "opacity 0.2s" }} contentStyle={{ width: "100%" }}>
                <Images cloudId={list[flickingIndex].src} cloudVariant="public" size="100%" rounded="none" alt={list[flickingIndex].name} />
              </TransformComponent>
            );
          }}
        </TransformWrapper>
      </div>
      <div className="flex items-center h-[8rem] bg-white border-t">
        <Flicking ref={flickingRef} cameraTag="ul" align="center" defaultIndex={defaultIndex} autoInit={false} moveType="freeScroll" onAfterResize={() => resetZoom()} style={{ width: "100%" }}>
          {list.map((item, index, array) => (
            <li key={item.key} id={item.key} role="tab" className="relative block panel px-1" aria-label={item.label} aria-controls={item.key} aria-selected={item.index === flickingIndex}>
              <SliderItem item={item} index={index} array={array} />
            </li>
          ))}
        </Flicking>
      </div>
    </div>
  );
};

export default PictureZoom;
