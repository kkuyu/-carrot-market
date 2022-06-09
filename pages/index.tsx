import type { NextPage } from "next";
import { Product } from "@prisma/client";
import useSWR from "swr";

import useUser from "@libs/client/useUser";

import Layout from "@components/layout";
import Item from "@components/item";
import FloatingButton from "@components/floating-button";

interface ProductResponse {
  success: boolean;
  products: Product[];
}

const Home: NextPage = () => {
  const { user, isLoading } = useUser();
  const { data } = useSWR<ProductResponse>("/api/products");

  if (isLoading || !user) {
    return null;
  }

  return (
    <Layout hasTabBar title="Home">
      <div className="container">
        <div className="-mx-4 flex flex-col divide-y">
          {data?.products?.map((product) => (
            <Item key={product.id} href={`/products/${product.id}`} title={product.name} price={product.price} hearts={1} />
          ))}
          <FloatingButton href="/products/upload">
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </FloatingButton>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
