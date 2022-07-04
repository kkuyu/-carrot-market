import Image from "next/image";

import { useEffect, useRef, useState } from "react";

import Flicking, { ViewportSlot } from "@egjs/react-flicking";
import "@egjs/react-flicking/dist/flicking.min.css";

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
}

const Thumbnails = ({ list, defaultIndex }: ThumbnailsProps) => {
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
        <span className="block pb-[80%]"></span>
        <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${list[0].src}/public`} alt={list[0].name} layout="fill" objectFit="cover" />
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
    >
      {list.map((item) => (
        <li key={item.key} id={item.key} role="tabpanel" className="relative block w-full panel" aria-roledescription="slide" aria-label={item.label} aria-hidden={item.index === flickingIndex}>
          <span className="block pb-[80%]"></span>
          <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${item.src}/public`} alt={item.name} layout="fill" objectFit="cover" />
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
