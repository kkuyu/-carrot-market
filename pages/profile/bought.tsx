import type { NextPage } from "next";

import Layout from "@components/layout";
import ProductList from "@components/product-list";

const Bought: NextPage = () => {
  return (
    <Layout canGoBack title="Bought">
      <div className="container">
        <ProductList kindValue="Purchase" />
      </div>
    </Layout>
  );
};

export default Bought;
