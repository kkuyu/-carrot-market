import type { NextPage } from "next";

import Layout from "../components/layout";
import Item from "../components/item";
import FloatingButton from "../components/floating-button";

const Home: NextPage = () => {
  return (
    <Layout hasTabBar title="Home">
      <div className="container">
        <div className="-mx-4 flex flex-col divide-y">
          {[1, 1, 1, 1, 1].map((_, i) => (
            <Item key={i} href={`/items/${i}`} title="iPhone 14" option="Black" price={99} comments={1} hearts={1} />
          ))}
          <FloatingButton href="/items/upload">
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
