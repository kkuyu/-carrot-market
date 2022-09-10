import Image from "next/image";
import type { HTMLAttributes } from "react";
import { useEffect, useState } from "react";
// @components
import Icons from "@components/icons";

interface ImagesProps extends HTMLAttributes<HTMLDivElement> {
  alt: string;
  size?: string;
  ratioX?: number;
  ratioY?: number;
  text?: string;
  cloudId?: string;
}

const Images = (props: ImagesProps) => {
  const { alt = "", size = "3.5rem", ratioX = 1, ratioY = 1, text, cloudId, className = "", ...restProps } = props;

  // variable: invisible
  const [imageState, setImageState] = useState({ isMounted: false, isError: false });
  const cloudVariant = /^[\d|\.]*(rem)$/.test(size) && parseFloat(size) <= 3.5 ? "avatar" : "public";

  useEffect(() => {
    setImageState((prev) => ({ ...prev, isMounted: true }));
  }, []);

  return (
    <div className={`relative bg-slate-300 overflow-hidden ${className}`} style={{ width: size, height: size, fontSize: size }} {...restProps}>
      <span className="block" style={{ paddingBottom: `${(ratioY / ratioX) * 100}%` }}></span>
      {cloudId && !imageState.isError ? (
        <Image
          src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${cloudId}/${cloudVariant}`}
          alt={alt}
          layout="fill"
          objectFit="cover"
          onError={() => setImageState((prev) => ({ ...prev, isError: true }))}
        />
      ) : imageState.isMounted ? (
        <span role="img" aria-label={alt} className="absolute top-0 bottom-0 left-0 right-0 flex items-center justify-center text-slate-500">
          {text ? <span className="text-[0.325em] font-semibold">{text}</span> : <Icons role="presentation" name="PuzzlePiece" className="w-[40%] h-[40%]" />}
        </span>
      ) : null}
    </div>
  );
};

export default Images;
