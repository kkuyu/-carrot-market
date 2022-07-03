import Image from "next/image";
import Link from "next/link";

import { GetProductsResponse } from "@api/products";

interface ProductsProps {
  list: GetProductsResponse["products"];
  pathname: string;
}

const Products = ({ list, pathname }: ProductsProps) => {
  if (!list.length) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list.map((item) => {
        const thumbnailId = item?.photo ? item.photo.split(",")[0] : "";
        return (
          <li key={item?.id}>
            <Link href={{ pathname, query: { id: item?.id } }}>
              <a className="relative block w-full p-5">
                <div className="flex items-start">
                  <div className="relative flex-none w-24 border border-gray-200 bg-slate-300 overflow-hidden rounded-md">
                    <div className="pb-[100%]" />
                    {thumbnailId ? <Image src={`https://imagedelivery.net/QG2MZZsP6KQnt-Ryd54wog/${thumbnailId}/public`} alt="" layout="fill" objectFit="cover" /> : null}
                  </div>
                  <div className="grow pl-4">
                    <strong className="block font-normal">{item?.name}</strong>
                    <span className="block text-sm text-gray-500">{item?.emdPosNm}</span>
                    <span className="block mt-2 pr-8 font-semibold">₩{item?.price}</span>
                  </div>
                </div>
                <div className="absolute bottom-5 right-5">
                  <div className="flex items-center space-x-0.5 text-sm text-gray-400">
                    <svg className="flex-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      ></path>
                    </svg>
                    <span>{item?.records?.length}</span>
                  </div>
                </div>
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default Products;
