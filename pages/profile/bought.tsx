import type { NextPage } from "next";

import Layout from "@components/layout";
import Item from "@components/item";

const Bought: NextPage = () => {
  return (
    <Layout canGoBack title="Bought">
      <div className="container">
        <div className="-mx-4 flex flex-col divide-y">
          {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => (
            <Item key={i} href={`/products/${i}`} title="iPhone 14" option="Black" price={99} comments={1} hearts={1} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Bought;
