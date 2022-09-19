import type { NextPage } from "next";
import useSWR, { SWRConfig } from "swr";
// @lib
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { getSearch, GetSearchResponse } from "@api/search";
import { PostSearchKeywordDeleteResponse } from "@api/search/keyword/delete";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import Icons from "@components/icons";
import Link from "next/link";

const SearchIndexPage: NextPage = () => {
  // fetch data
  const { data: searchData, mutate: searchMutate } = useSWR<GetSearchResponse>("/api/search?");

  // mutation data
  const [deleteSearchKeyword, { loading: loadingSearchKeyword }] = useMutation<PostSearchKeywordDeleteResponse>(`/api/search/keyword/delete`, {
    onSuccess: async (data) => {
      await searchMutate();
    },
  });

  const removeSearch = (records: GetSearchResponse["history"]) => {
    if (loadingSearchKeyword) return;
    const keywords = records.map((record) => record.keyword);
    searchMutate((prev) => {
      return prev && { ...prev, history: [...prev.history].filter((record) => !keywords.includes(record.keyword)) };
    }, false);
    deleteSearchKeyword({ keywords });
  };

  return (
    <div className="container pt-5 pb-5">
      <h1 className="sr-only">검색</h1>

      <div>
        <h2>이웃들이 많이 찾고 있어요!</h2>
        <ul className="mt-3 space-x-2 overflow-x-auto whitespace-nowrap">
          {searchData &&
            Boolean(searchData?.searches?.length) &&
            searchData?.searches?.map((record) => (
              <li key={record.id} className="inline-block">
                <Link href={{ pathname: "/search/result/[models]", query: { models: "previews", keyword: record.keyword } }} passHref>
                  <Buttons tag="a" sort="text-link" status="unset" size="base" className="pt-0.5 pb-0.5 pl-2.5 pr-2.5 border border-gray-300 rounded-2xl">
                    {record.keyword}
                  </Buttons>
                </Link>
              </li>
            ))}
        </ul>
      </div>

      {searchData && Boolean(searchData?.history?.length) && (
        <div className="mt-5 relative">
          <h2>최근 검색어</h2>
          <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1">
            {searchData.history.map((record) => {
              return (
                <li key={record.keyword} className="relative">
                  <Link href={{ pathname: "/search/result/[models]", query: { models: "previews", keyword: record.keyword } }} passHref>
                    <Buttons tag="a" sort="text-link" status="unset" className="w-full py-1.5 pl-0 pr-8 border-b border-gray-300 text-ellipsis align-top">
                      <span>{record.keyword}</span>
                      <span className="sr-only"> 검색</span>
                    </Buttons>
                  </Link>
                  <Buttons tag="button" type="button" sort="icon-block" status="default" size="sm" onClick={() => removeSearch([record])} className="absolute top-1/2 right-0 -translate-y-1/2">
                    <Icons name="XMark" className="w-4 h-4" />
                    <span className="sr-only">{record.keyword} 삭제</span>
                  </Buttons>
                </li>
              );
            })}
          </ul>
          <Buttons tag="button" type="button" sort="text-link" status="unset" size="sm" className="absolute top-0 right-0" onClick={() => removeSearch([...searchData.history])}>
            모두 지우기
          </Buttons>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getSearch: { options: { url: string; query: string }; response: GetSearchResponse };
}> = ({ getSearch }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getSearch?.options?.url}?${getSearch?.options?.query}`]: getSearch.response,
        },
      }}
    >
      <SearchIndexPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getSearch
  const searchData = await getSearch({
    search: req?.session?.search,
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `검색`,
    },
    header: {
      title: "",
      titleTag: "strong",
      utils: ["back", "search"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getSearch: {
        options: {
          url: "/api/search",
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(searchData || {})),
        },
      },
    },
  };
});

export default Page;
