import { useRouter } from "next/router";
import type { NextPage } from "next";
import Link from "next/link";
import { Product, User } from "@prisma/client";
import useSWR from "swr";

import Layout from "@components/layout";
import Button from "@components/button";
import useMutation from "@libs/client/useMutation";
import { cls } from "@libs/utils";

interface ProductDetailResponse {
  success: boolean;
  product: Product & { user: Pick<User, "id" | "name" | "avatar"> };
  isFavorite: boolean;
  relatedProducts: Product[];
}

const ProductDetail: NextPage = () => {
  const router = useRouter();

  const { data } = useSWR<ProductDetailResponse>(router.query.id ? `/api/products/${router.query.id}` : null);

  const [toggleFavorite] = useMutation(`/api/products/${router.query.id}/favorite`);

  const onFavoriteClick = () => {
    toggleFavorite({});
  };

  return (
    <Layout canGoBack>
      <div className="container pt-5 pb-5">
        <div>
          <div className="h-96 bg-slate-300" />
          <div className="border-t border-b">
            <div className="flex items-center w-full space-x-3 py-3 text-left">
              <div className="flex-none w-12 h-12 bg-slate-300 rounded-full" />
              <div>
                <strong className="block text-sm font-semibold text-gray-700">{data?.product.user.name}</strong>
                <Link href={`/users/profiles/${data?.product.user.id}`}>
                  <a className="block text-xs font-semibold text-gray-500">View profile &rarr;</a>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <h1 className="text-3xl font-bold text-gray-900">{data?.product.name}</h1>
            <span className="mt-3 block text-3xl text-gray-900">${data?.product.price}</span>
            <p className="my-6 text-gray-700">{data?.product.description}</p>
            <div className="flex items-center justify-between space-x-2">
              <Button large text="Talk to seller" />
              <button
                onClick={onFavoriteClick}
                className={cls("flex items-center justify-center p-3 rounded-md hover:bg-gray-100", data?.isFavorite ? "text-red-500 hover:text-red-600" : "text-gray-400  hover:text-gray-500")}
              >
                {data?.isFavorite ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="h-6 w-6 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {!data?.relatedProducts || !data.relatedProducts.length ? null : (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900">Similar items</h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {data.relatedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <a>
                    <div className="w-full h-56 bg-slate-300" />
                    <h3 className="mt-4 text-gray-700">{product.name}</h3>
                    <span className="-mt-1 text-sm font-semibold text-gray-900">${product.price}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
