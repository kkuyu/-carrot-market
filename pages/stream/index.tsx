import type { NextPage } from "next";

import Layout from "../../components/layout";

const Stream: NextPage = () => {
  return (
    <Layout hasTabBar title="Stream">
      <div className="container">
        <div className="-mx-4 divide-y">
          {[1, 1, 1, 1, 1].map((_, i) => {
            return (
              <div key={i}>
                <button className="w-full px-4 py-5 text-left">
                  <div className="w-full aspect-video bg-slate-300 rounded-md shadow-md" />
                  <h3 className="mt-2 text-base text-gray-800">Let&apos;s try carrot</h3>
                </button>
              </div>
            );
          })}
        </div>
        <button className="fixed bottom-24 right-5 p-4 text-white bg-orange-400 transition-colors rounded-full shadow-xl hover:bg-orange-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
        </button>
      </div>
    </Layout>
  );
};

export default Stream;
