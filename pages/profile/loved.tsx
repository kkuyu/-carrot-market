import type { NextPage } from "next";

import Layout from "@components/layout";
import ProductList from "@components/product-list";

const Loved: NextPage = () => {
  return (
    <Layout canGoBack title="Loved">
      <div className="container">
        <ProductList kindValue="Favorite" />
      </div>
    </Layout>
  );
};

export default Loved;
