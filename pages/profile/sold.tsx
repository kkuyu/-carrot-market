import type { NextPage } from "next";

import Layout from "@components/layout";
import ProductList from "@components/product-list";

const Sold: NextPage = () => {
  return (
    <Layout canGoBack title="Sold">
      <div className="container">
        <ProductList kindValue="Sale" />
      </div>
    </Layout>
  );
};

export default Sold;
