import { useEffect } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { Stream } from "@prisma/client";
import useSWRInfinite from "swr/infinite";

import usePagination from "@libs/client/usePagination";

import Layout from "@components/layout";
import FloatingButton from "@components/floating-button";

interface StreamsResponse {
  success: boolean;
  streams: Stream[];
  pages: number;
}

const Streams: NextPage = () => {
  const { page } = usePagination({ isInfiniteScroll: true });

  const getKey = (pageIndex: number, previousPageData: StreamsResponse) => {
    if (pageIndex === 0) return `/api/streams?page=1`;
    if (previousPageData && !previousPageData.streams.length) return null;
    if (pageIndex + 1 > previousPageData.pages) return null;
    return `/api/streams?page=${pageIndex + 1}`;
  };

  const { data, setSize } = useSWRInfinite<StreamsResponse>(getKey, (url: string) => fetch(url).then((response) => response.json()), {
    initialSize: 1,
    revalidateFirstPage: false,
  });
  const streams = data ? data.flatMap((item) => item.streams) : [];

  useEffect(() => {
    setSize(page);
  }, [setSize, page]);

  return (
    <Layout hasTabBar title="Live Stream">
      <div className="container">
        <div className="-mx-4 divide-y">
          {streams.map((stream) => {
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
