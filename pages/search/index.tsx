import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
// @lib
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetSearchResponse, PostSearchResponse } from "@api/search";
import { PostSearchDeleteResponse } from "@api/search/delete";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";

const SearchIndexPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const { data, mutate: boundMutate } = useSWR<GetSearchResponse>("/api/search");

  const [saveSearch, { loading: saveLoading }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: (data) => {
      const keyword = data?.history?.[0]?.keyword || "";
      router.push({ pathname: "/search/result/all", query: { keyword } });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const [deleteSearch, { loading: deleteLoading }] = useMutation<PostSearchDeleteResponse>(`/api/search/delete`, {
    onSuccess: (data) => {
      boundMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const clickSave = (record: GetSearchResponse["history"][0] | GetSearchResponse["record"][0]) => {
    if (saveLoading) return;
    saveSearch({ keyword: record.keyword });
  };

  const clickDelete = (records: GetSearchResponse["history"]) => {
    if (deleteLoading) return;
    const keywords = records.map((record) => record.keyword);
    boundMutate((prev) => {
      return prev && { ...prev, history: [...prev.history].filter((record) => !keywords.includes(record.keyword)) };
    }, false);
    deleteSearch({ keywords });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <h1 className="sr-only">검색</h1>

      <div>
        <h2>이웃들이 많이 찾고 있어요!</h2>
        <ul className="mt-3 -mx-1 overflow-x-auto whitespace-nowrap">
          {[...(data && Boolean(data?.records?.length) ? [...data.records] : [{ id: 0, keyword: "당근마켓" }])].map((record) => (
            <li key={record.id} className="inline-block px-1">
              <Buttons
                tag="button"
                type="button"
                sort="text-link"
                status="unset"
                size="base"
                text={record.keyword}
                onClick={() => clickSave(record)}
                className="pt-0.5 pb-0.5 !px-2.5 border border-gray-300 rounded-2xl"
              />
            </li>
          ))}
        </ul>
      </div>

      {data && Boolean(data?.history?.length) && (
        <div className="mt-5 relative">
          <h2>최근 검색어</h2>
          <ul className="mt-1.5 -mx-3 flex flex-wrap">
            {data.history.map((record) => {
              return (
                <li key={record.keyword} className="relative w-1/2 px-3 [&:nth-child(n+3)]:mt-1">
                  <Buttons
                    tag="button"
                    type="button"
                    sort="text-link"
                    status="unset"
                    text={record.keyword}
                    onClick={() => clickSave(record)}
                    className="w-full py-1.5 pr-8 border-b border-gray-300 whitespace-nowrap overflow-hidden overflow-ellipsis"
                  />
                  <Buttons
                    tag="button"
                    type="button"
                    sort="icon-block"
                    status="default"
                    size="sm"
                    text={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                    onClick={() => clickDelete([record])}
                    className="absolute top-1/2 right-3 flex -translate-y-1/2"
                    aria-label={`${record.keyword} 삭제`}
                  />
                </li>
              );
            })}
          </ul>
          <Buttons tag="button" type="button" sort="text-link" status="unset" size="sm" text="모두 지우기" className="absolute top-0 right-0" onClick={() => clickDelete([...data.history])} />
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getSearch: { response: GetSearchResponse };
}> = ({ getSearch }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/search": getSearch.response,
        },
      }}
    >
      <SearchIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getSearch
  const history = [...(req?.session?.search?.history || [])].reverse();

  const records = await client.searchRecord.findMany({
    take: 10,
    orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      keyword: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `검색`,
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["back", "keyword"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getSearch: {
        response: {
          success: true,
          history: JSON.parse(JSON.stringify(history || [])),
          records: JSON.parse(JSON.stringify(records || [])),
        },
      },
    },
  };
});

export default Page;
