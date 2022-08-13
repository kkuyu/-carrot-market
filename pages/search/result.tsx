import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetSearchResultResponse } from "@api/search/result";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";

type SearchTab = {
  index: number;
  value: "result" | "result/products" | "result/stories";
  text: string;
  name: string;
};

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();

  const searchTabs: SearchTab[] = [
    { value: "result", index: 0, text: "통합", name: "게시글" },
    { value: "result/products", index: 1, text: "중고거래", name: "게시글" },
    { value: "result/stories", index: 2, text: "동네생활", name: "게시글" },
  ];
  const [currentTab, setCurrentTab] = useState<SearchTab>(() => {
    return searchTabs.find((tab) => tab.value === router?.query?.filter) || searchTabs.find((tab) => tab.index === 0) || searchTabs[0];
  });
  const recentlyKeyword = router?.query?.keyword?.toString();

  const { data, setSize, mutate } = useSWRInfinite<GetSearchResultResponse>((...arg: [index: number, previousPageData: GetSearchResultResponse]) => {
    const options = {
      url: `/api/search/${currentTab.value}`,
      query: `keyword=${recentlyKeyword}&` + `${currentAddr?.emdAddrNm ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : ""}`,
    };
    return getKey<GetSearchResultResponse>(...arg, options);
  });

  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const { isVisible } = useOnScreen({ ref: infiniteRef, rootMargin: "20px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const results = data
    ? {
        products: data.flatMap((item) => item.products),
        stories: data.flatMap((item) => item.stories),
      }
    : null;

  const changeFilter = (tab: SearchTab) => {
    setCurrentTab(tab);
    window.scrollTo(0, 0);
    router.replace({ pathname: router.pathname, query: { ...router.query, filter: tab.value } }, undefined, { shallow: true });
  };

  useEffect(() => {
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && currentAddr?.emdAddrNm) mutate();
  }, [data, currentAddr, userType]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container">
      <div className="sticky top-12 left-0 -mx-5 flex bg-white border-b z-[1]">
        {searchTabs.map((tab) => {
          return (
            <button
              key={tab.index}
              type="button"
              className={`basis-full py-2 text-sm font-semibold ${tab.value === currentTab.value ? "text-black" : "text-gray-500"}`}
              onClick={() => changeFilter(tab)}
            >
              {tab.text}
            </button>
          );
        })}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
          style={{ width: `${100 / searchTabs.length}%`, transform: `translateX(${100 * currentTab.index}%)` }}
        />
      </div>

      {/* 게시글: List */}
      {results && (Boolean(results.products.length) || Boolean(results.stories.length)) && (
        <>
          {currentTab.value === "result" ? (
            <div className="-mx-5 divide-y-8">
              {Boolean(results.products.length) && (
                <div>
                  <h2 className="px-5 pt-3">중고거래</h2>
                  <ProductList list={results.products} highlight={recentlyKeyword?.split(" ")} />
                </div>
              )}
              {Boolean(results.stories.length) && (
                <div>
                  <h2 className="px-5 pt-3">동네생활</h2>
                  <StoryList list={results.stories} highlight={recentlyKeyword?.split(" ")} />
                </div>
              )}
            </div>
          ) : (
            <div className="-mx-5">
              {Boolean(results.products.length) && <ProductList list={results.products} highlight={recentlyKeyword?.split(" ")} />}
              {Boolean(results.stories.length) && <StoryList list={results.stories} highlight={recentlyKeyword?.split(" ")} />}
              <div ref={infiniteRef} />
              {isReachingEnd ? (
                <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 모두 확인하였어요</span>
              ) : isLoading ? (
                <span className="block px-5 py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 불러오고있어요</span>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* 게시글: Empty */}
      {results && !(Boolean(results.products.length) || Boolean(results.stories.length)) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
        },
      }}
    >
      <SearchPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params, query }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // recentlyKeyword
  const recentlyKeyword: string = query?.keyword?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!recentlyKeyword) invalidUrl = true;
  // redirect `/search`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/search`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${recentlyKeyword} | 검색 결과`,
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
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
