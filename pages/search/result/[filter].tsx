import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetSearchResponse, PostSearchResponse } from "@api/search";
import { GetSearchResultResponse, ResultsFilterEnum } from "@api/search/result/[filter]";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";
import PictureList from "@components/groups/pictureList";
import FilterProduct, { FilterProductTypes } from "@components/forms/filterProduct";

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr, type: userType } = useUser();
  const { changeLayout } = useLayouts();

  // tabs
  const searchTabs: { value: ResultsFilterEnum; text: string; name: string }[] = [
    { value: "all", text: "통합", name: "게시글" },
    { value: "product", text: "중고거래", name: "중고거래 게시글" },
    { value: "story", text: "동네생활", name: "동네생활 게시글" },
  ];
  const currentIndex = searchTabs.findIndex((tab) => tab.value === router.query.filter);
  const currentTab = searchTabs?.[currentIndex]!;

  // search
  const { data: searchData, mutate: searchMutate } = useSWR<GetSearchResponse>("/api/search");
  const [saveSearch, { loading: saveLoading }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: (data) => {
      searchMutate();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // form
  const formData = useForm<FilterProductTypes>({
    defaultValues: {
      excludeSold: searchData?.productFilter?.excludeSold,
    },
  });
  const searchFilter = useMemo(() => {
    const keyword = router?.query?.keyword?.toString() || "";
    const excludeSold = searchData?.productFilter?.excludeSold || false;
    return {
      recentlySearchKeyword: keyword,
      highlightWord: keyword.replace(/\s+/g, ";"),
      excludeSold,
      includeSold: !excludeSold,
    };
  }, [router?.query, searchData]);

  // data
  const { data, setSize, mutate } = useSWRInfinite<GetSearchResultResponse>((...arg: [index: number, previousPageData: GetSearchResultResponse]) => {
    const options = {
      url: `/api/search/result/${currentTab.value}`,
      query: `keyword=${searchFilter.recentlySearchKeyword}` + `${currentAddr?.emdAddrNm ? `&posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : ""}`,
    };
    return getKey<GetSearchResultResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : [];
  const stories = data ? data.flatMap((item) => item.stories) : [];

  useEffect(() => {
    if (currentTab.value === "all") return;
    if (isVisible && !isReachingEnd) {
      setSize((size) => size + 1);
    }
  }, [isVisible, isLoading, isReachingEnd]);

  useEffect(() => {
    if (!data?.[0].success && currentAddr?.emdAddrNm) mutate();
  }, [data, currentAddr, userType]);

  useEffect(() => {
    mutate();
  }, [searchFilter.recentlySearchKeyword, searchFilter.excludeSold]);

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
            <Link key={tab.value} href={{ pathname: router.pathname, query: { filter: tab.value, keyword: router.query.keyword } }} replace passHref>
              <a className={`basis-full py-2 text-sm text-center font-semibold ${tab.value === router?.query?.filter ? "text-black" : "text-gray-500"}`}>{tab.text}</a>
            </Link>
          );
        })}
        <span className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform" style={{ width: `${100 / searchTabs.length}%`, transform: `translateX(${100 * currentIndex}%)` }} />
      </div>

      {/* 필터 */}
      {currentTab.value === "product" && (
        <FilterProduct
          formData={formData}
          onValid={(data: FilterProductTypes) => {
            if (saveLoading) return false;
            saveSearch({ ...data });
          }}
          className={`pt-3`}
        />
      )}

      {/* 검색결과: List */}
      {data && (Boolean(products.length) || Boolean(stories.length)) && (
        <div>
          {/* 중고거래 */}
          {Boolean(products.length) && <h2 className={`pt-3 ${currentTab.value === "all" ? "" : "sr-only"}`}>중고거래</h2>}
          {Boolean(products.length) && <ProductList list={products} cardProps={{ highlightWord: searchFilter.highlightWord }} className="[&>li>a]:pl-0 [&>li>a]:pr-0" />}
          {Boolean(products.length) && currentTab.value === "all" && products.length < data?.[data.length - 1]?.productTotalCount! && (
            <Link href={{ pathname: router.pathname, query: { filter: "product", keyword: router.query.keyword } }} replace passHref>
              <Buttons tag="a" status="default" size="sm">
                중고거래 더보기
              </Buttons>
            </Link>
          )}
          {/* 동네생활 */}
          {Boolean(stories.length) && currentTab.value === "all" && Boolean(products.length) && <span className="block mt-3 -mx-5 h-[8px] bg-gray-200" />}
          {Boolean(stories.length) && <h2 className={`pt-3 ${currentTab.value === "all" ? "" : "sr-only"} ${Boolean(products.length) ? "" : ""}`}>동네생활</h2>}
          {Boolean(stories.length) && (
            <StoryList list={stories} cardProps={{ highlightWord: searchFilter.highlightWord, summaryType: "report" }} className="[&>li>a]:pl-0 [&>li>a]:pr-0">
              <PictureList key="PictureList" className="pb-3" />
            </StoryList>
          )}
          {Boolean(stories.length) && currentTab.value === "all" && stories.length < data?.[data.length - 1]?.storyTotalCount! && (
            <Link href={{ pathname: router.pathname, query: { filter: "story", keyword: router.query.keyword } }} replace passHref>
              <Buttons tag="a" status="default" size="sm" className="pb-3">
                동네생활 더보기
              </Buttons>
            </Link>
          )}
          {currentTab.value === "all" ? null : isReachingEnd ? (
            <span className="block py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 모두 확인하였어요</span>
          ) : isLoading ? (
            <span className="block py-6 text-center border-t text-sm text-gray-500">{currentTab?.name}을 불러오고있어요</span>
          ) : null}
        </div>
      )}

      {/* 검색결과: Empty */}
      {data && !(Boolean(products.length) || Boolean(stories.length)) && (
        <div className="py-10 text-center">
          <p className="text-gray-500">{`${currentTab?.name}이 존재하지 않아요`}</p>
        </div>
      )}

      {/* 검색결과: InfiniteRef */}
      <div id="infiniteRef" ref={infiniteRef} />
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getSearch: { response: GetSearchResponse };
  getResults: { options: { url: string; query?: string }; response: GetSearchResultResponse };
  getProducts: { options: { url: string; query?: string }; response: GetSearchResultResponse };
  getStories: { options: { url: string; query?: string }; response: GetSearchResultResponse };
}> = ({ getUser, getSearch, getResults, getProducts, getStories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          "/api/search": getSearch.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetSearchResultResponse]) => getKey<GetSearchResultResponse>(...arg, getResults.options))]: [getResults.response],
          [unstable_serialize((...arg: [index: number, previousPageData: GetSearchResultResponse]) => getKey<GetSearchResultResponse>(...arg, getProducts.options))]: [getProducts.response],
          [unstable_serialize((...arg: [index: number, previousPageData: GetSearchResultResponse]) => getKey<GetSearchResultResponse>(...arg, getStories.options))]: [getStories.response],
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

  // getSearch
  const history = [...(req?.session?.search?.history || [])].reverse();
  const productFilter = { ...req?.session?.search?.productFilter };
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

  // filter
  const filter: string = query?.filter?.toString() || "";
  const recentlySearchKeyword: string = query?.keyword?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!recentlySearchKeyword) invalidUrl = true;
  // redirect `/search`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/search`,
      },
    };
  }

  // invalidFilter
  let invalidFilter = false;
  if (!filter || !isInstance(filter, ResultsFilterEnum)) invalidFilter = true;
  // redirect `/search/result/all?keyword=${recentlySearchKeyword}`,
  if (invalidFilter) {
    return {
      redirect: {
        permanent: false,
        destination: `/search/result/all?keyword=${recentlySearchKeyword}`,
      },
    };
  }

  // params
  const excludeSold = req?.session?.search?.productFilter?.excludeSold || false;
  const includeSold = !excludeSold;
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  // getProducts
  const products =
    !posX || !posY || !distance
      ? []
      : await client.product.findMany({
          take: 10,
          skip: 0,
          orderBy: {
            resumeAt: "desc",
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
            OR: [
              ...recentlySearchKeyword.split(" ").map((word: string) => ({
                name: { contains: word },
              })),
            ],
            ...(!includeSold ? { AND: { records: { some: { kind: Kind.ProductSale } } } } : {}),
          },
          include: {
            records: {
              where: {
                OR: [{ kind: Kind.ProductSale }, { kind: Kind.ProductLike }],
              },
              select: {
                id: true,
                kind: true,
                userId: true,
              },
            },
            chats: {
              include: {
                _count: {
                  select: {
                    chatMessages: true,
                  },
                },
              },
            },
          },
        });

  // getStories
  const stories =
    !posX || !posY || !distance
      ? []
      : await client.story.findMany({
          take: 10,
          skip: 0,
          orderBy: [{ records: { _count: "desc" } }, { comments: { _count: "desc" } }, { createdAt: "desc" }],
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            records: {
              where: {
                kind: Kind.StoryLike,
              },
              select: {
                id: true,
                kind: true,
                emotion: true,
                userId: true,
              },
            },
            comments: {
              take: 1,
              orderBy: [{ depth: "asc" }, { createdAt: "asc" }],
              where: {
                NOT: [{ content: "" }, { depth: { gte: StoryCommentMaximumDepth } }, { depth: { lte: StoryCommentMinimumDepth } }],
                OR: [
                  ...recentlySearchKeyword.split(" ").map((word: string) => ({
                    content: { contains: word },
                  })),
                ],
              },
              select: {
                id: true,
                depth: true,
                userId: true,
                content: true,
              },
            },
          },
          where: {
            emdPosX: { gte: posX - distance, lte: posX + distance },
            emdPosY: { gte: posY - distance, lte: posY + distance },
            OR: [
              ...recentlySearchKeyword.split(" ").map((word: string) => ({
                content: { contains: word },
              })),
            ],
          },
        });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${recentlySearchKeyword} | 검색 결과`,
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
      getSearch: {
        response: {
          success: true,
          history: JSON.parse(JSON.stringify(history || [])),
          productFilter: JSON.parse(JSON.stringify(productFilter || {})),
          records: JSON.parse(JSON.stringify(records || [])),
        },
      },
      getResults: {
        options: {
          url: "/api/search/result/all",
          query: `keyword=${recentlySearchKeyword}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          productTotalCount: products.length,
          products: JSON.parse(JSON.stringify([...products].slice(0, 4) || [])),
          storyTotalCount: stories.length,
          stories: JSON.parse(JSON.stringify([...stories].slice(0, 4) || [])),
        },
      },
      getProducts: {
        options: {
          url: "/api/search/result/product",
          query: `keyword=${recentlySearchKeyword}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify(products || [])),
          stories: JSON.parse(JSON.stringify([])),
        },
      },
      getStories: {
        options: {
          url: "/api/search/result/story",
          query: `keyword=${recentlySearchKeyword}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          products: JSON.parse(JSON.stringify([])),
          stories: JSON.parse(JSON.stringify(stories || [])),
        },
      },
    },
  };
});

export default Page;
