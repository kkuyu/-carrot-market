import type { NextPage } from "next";

import Layout from "../../components/layout";

const Chats: NextPage = () => {
  return (
    <Layout hasTabBar title="Inbox">
      <div className="container">
        <div className="-mx-4 divide-y">
          {[1, 1, 1, 1, 1].map((_, i) => {
            return (
              <div key={i}>
                <button className="flex items-center w-full space-x-3 px-4 py-5 text-left">
                  <div className="flex-none w-12 h-12 bg-slate-300 rounded-full" />
                  <div>
                    <strong className="font-semibold text-gray-700">Steve Jebs</strong>
                    <p className="text-sm text-gray-500">See you tomorrow in the corner at 2pm! &rarr;</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Chats;
