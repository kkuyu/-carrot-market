import Image from "next/image";
import Link from "next/link";

import { GetProductDetailResponse } from "@api/products/[id]";

interface RelatesProps {
  list: GetProductDetailResponse["otherProducts"] | GetProductDetailResponse["similarProducts"] | GetProductDetailResponse["latestProducts"];
  pathname: string;
}

const Relates = ({ list, pathname }: RelatesProps) => {
  if (!list.length) {
    return null;
  }

  return (
    <ul className="-m-2 block after:block after:clear-both">
      {list.map((item) => {
        const thumbnailId = item?.photo ? item.photo.split(",")[0] : "";
        return (
          <li key={item?.id} className="float-left w-1/2 p-2">
            <Link href={{ pathname, query: { id: item?.id } }}>
              <a className="block">
                <div className="relative w-full border border-gray-200 bg-slate-300 overflow-hidden rounded-md">
                  <div className="pb-[56%]" />
                  {thumbnailId ? (
                    <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${thumbnailId}/public`} alt="" layout="fill" objectFit="cover" />
                  ) : (
                    <svg className="absolute top-1/2 left-1/2 -mt-4 -ml-4 w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      ></path>
                    </svg>
                  )}
                </div>
                <div className="mt-2">
                  <strong className="block font-normal">{item?.name}</strong>
                  <span className="block text-sm font-semibold">₩{item?.price}</span>
                </div>
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default Relates;