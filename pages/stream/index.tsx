import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@components/layout";
import FloatingButton from "@components/floating-button";

const Stream: NextPage = () => {
  return (
    <Layout hasTabBar title="Stream">
      <div className="container">
        <div className="-mx-4 divide-y">
          {[1, 1, 1, 1, 1].map((_, i) => {
            return (
              <Link key={i} href={`/stream/${i}`}>
                <a className="block px-4 py-5">
                  <div className="w-full aspect-video bg-slate-300 rounded-md shadow-md" />
                  <h3 className="mt-2 text-base text-gray-800">Let&apos;s try carrot</h3>
                </a>
              </Link>
            );
          })}
        </div>
        <FloatingButton href="/stream/create">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
        </FloatingButton>
      </div>
    </Layout>
  );
};

export default Stream;
