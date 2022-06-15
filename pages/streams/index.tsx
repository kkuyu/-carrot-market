import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@components/layout";
import FloatingButton from "@components/floating-button";
import { Stream } from "@prisma/client";
import useSWR from "swr";

interface StreamsResponse {
  success: boolean;
  streams: Stream[];
}

const Streams: NextPage = () => {
  const { data } = useSWR<StreamsResponse>("/api/streams");

  return (
    <Layout hasTabBar title="Live Stream">
      <div className="container">
        <div className="-mx-4 divide-y">
          {data?.streams.map((stream) => {
            return (
              <Link key={stream.id} href={`/streams/${stream.id}`}>
                <a className="block px-4 py-5">
                  <div className="w-full aspect-video bg-slate-300 rounded-md shadow-md" />
                  <h3 className="mt-2 text-base font-semibold">{stream.name}</h3>
                </a>
              </Link>
            );
          })}
        </div>
        <FloatingButton href="/streams/create">
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

export default Streams;
