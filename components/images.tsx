import Image from "next/image";
import { useEffect, useState } from "react";

interface ImagesProps {
  alt: string;
  size?: string;
  ratioX?: number;
  ratioY?: number;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  cloudId?: string | null | undefined;
  cloudVariant?: string;
}

const Images = ({ alt = "", size = "3.5rem", ratioX = 1, ratioY = 1, rounded = "full", cloudId: _cloudId, cloudVariant = "public" }: ImagesProps) => {
  const [mounted, setMounted] = useState(false);
  const [cloudId, setCloudId] = useState<string | null>(null);

  const onError = () => {
    setCloudId(null);
  };

  useEffect(() => {
    setCloudId(_cloudId ? _cloudId : null);
  }, [_cloudId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative bg-slate-300 overflow-hidden ${rounded ? `rounded-${rounded}` : ""}`} style={{ width: size, height: size }}>
      <span className="block" style={{ paddingBottom: `${(ratioY / ratioX) * 100}%` }}></span>
      {cloudId ? (
        <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${cloudId}/${cloudVariant}`} alt={alt} layout="fill" objectFit="cover" onError={onError} />
      ) : mounted ? (
        <svg
          role="image"
          aria-label={alt}
          className="absolute top-1/2 left-1/2 w-1/2 h-1/2 text-slate-500 -translate-x-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          ></path>
        </svg>
      ) : null}
    </div>
  );
};

export default Images;
