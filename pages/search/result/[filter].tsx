import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
import { Kind } from "@prisma/client";
// @lib
import { getKey, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useOnScreen from "@libs/client/useOnScreen";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetSearchResultResponse, ResultsFilterEnum } from "@api/search/result/[filter]";
import { StoryCommentMaximumDepth, StoryCommentMinimumDepth } from "@api/stories/types";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Buttons from "@components/buttons";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";
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

  // form
  const formData = useForm<FilterProductTypes>();
  const recentlyKeyword = router?.query?.keyword?.toString();

  // data
  const { data, setSize, mutate } = useSWRInfinite<GetSearchResultResponse>((...arg: [index: number, previousPageData: GetSearchResultResponse]) => {
    const excludeSold = formData.getValues("excludeSold") || false;
    const options = {
      url: `/api/search/result/${currentTab.value}`,
      query:
        `${recentlyKeyword ? `keyword=${recentlyKeyword}&includeSold=${!excludeSold}` : ""}` +
        `${currentAddr?.emdAddrNm ? `&posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}` : ""}`,
    };
    return getKey<GetSearchResultResponse>(...arg, options);
  });

  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const products = data ? data.flatMap((item) => item.products) : [];
  const stories = data ? data.flatMap((item) => item.stories) : [];

  const inputFilter = (data: FilterProductTypes) => {
    window.scrollTo(0, 0);
    mutate();
  };

  useEffect(() => {
    if (currentTab.value === "all") return;
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
            <Link key={tab.value} href={{ pathname: router.pathname, query: { filter: tab.value, keyword: recentlyKeyword } }} replace passHref>
              <a className={`basis-full py-2 text-sm text-center font-semibold ${tab.value === router?.query?.filter ? "text-black" : "text-gray-500"}`}>{tab.text}</a>
            </Link>
          );
        })}
        <span className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform" style={{ width: `${100 / searchTabs.length}%`, transform: `translateX(${100 * currentIndex}%)` }} />
      </div>

      {/* 검색결과: List */}
      {data && (Boolean(products.length) || Boolean(stories.length)) && (
        <div>
          {/* 중고거래 */}
          {Boolean(products.length) && <h2 className={`pt-3 ${currentTab.value === "all" ? "" : "sr-only"}`}>중고거래</h2>}
          {Boolean(products.length) && <FilterProduct formData={formData} onValid={inputFilter} className={`pt-3 ${currentTab.value === "product" ? "" : "hidden"}`} />}
          {Boolean(products.length) && <ProductList list={products} highlight={recentlyKeyword?.split(" ")} className="[&>li>a]:pl-0 [&>li>a]:pr-0" />}
          {Boolean(products.length) && currentTab.value === "all" && products.length < data?.[data.length - 1]?.productTotalCount! && (
            <Link href={{ pathname: router.pathname, query: { filter: "product", keyword: recentlyKeyword } }} replace passHref>
              <Buttons tag="a" status="default" size="sm" text="중고거래 더보기" />
            </Link>
          )}
          {/* 동네생활 */}
          {Boolean(stories.length) && currentTab.value === "all" && Boolean(products.length) && <span className="block mt-3 -mx-5 h-[8px] bg-gray-200" />}
          {Boolean(stories.length) && <h2 className={`pt-3 ${currentTab.value === "all" ? "" : "sr-only"} ${Boolean(products.length) ? "" : ""}`}>동네생활</h2>}
          {Boolean(stories.length) && <StoryList list={stories} highlight={recentlyKeyword?.split(" ")} className="[&>li>a]:pl-0 [&>li>a]:pr-0" />}
          {Boolean(stories.length) && currentTab.value === "all" && stories.length < data?.[data.length - 1]?.storyTotalCount! && (
            <Link href={{ pathname: router.pathname, query: { filter: "story", keyword: recentlyKeyword } }} replace passHref>
              <Buttons tag="a" status="default" size="sm" text="동네생활 더보기" className="pb-3" />
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
  getResults: { options: { url: string; query?: string }; response: GetSearchResultResponse };
  getProducts: { options: { url: string; query?: string }; response: GetSearchResultResponse };
  getStories: { options: { url: string; query?: string }; response: GetSearchResultResponse };
}> = ({ getUser, getResults, getProducts, getStories }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
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

  // recentlyKeyword
  const recentlyKeyword: string = query?.keyword?.toString() || "";
  // filter
  const filter: string = params?.filter?.toString() || "";

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

  // invalidFilter
  let invalidFilter = false;
  if (!filter || !isInstance(filter, ResultsFilterEnum)) invalidFilter = true;
  // redirect `/search/result/all?keyword=${recentlyKeyword}`,
  if (invalidFilter) {
    return {
      redirect: {
        permanent: false,
        destination: `/search/result/all?keyword=${recentlyKeyword}`,
      },
    };
  }

  const excludeSold = false;
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
              ...recentlyKeyword.split(" ").map((word: string) => ({
                name: { contains: word },
              })),
            ],
            AND: { records: { some: { kind: { in: Kind.ProductSale } } } },
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
                  ...recentlyKeyword.split(" ").map((word: string) => ({
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
              ...recentlyKeyword.split(" ").map((word: string) => ({
                content: { contains: word },
              })),
            ],
          },
        });

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
      getResults: {
        options: {
          url: "/api/search/result/all",
          query: `keyword=${recentlyKeyword}&includeSold=${!excludeSold}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          totalCount: 0,
          lastCursor: -1,
          productTotalCount: products.length,
          products: JSON.parse(JSON.stringify(products.slice(0, 4) || [])),
          storyTotalCount: stories.length,
          stories: JSON.parse(JSON.stringify(stories.slice(0, 4) || [])),
        },
      },
      getProducts: {
        options: {
          url: "/api/search/result/product",
          query: `keyword=${recentlyKeyword}&includeSold=${!excludeSold}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          totalCount: 0,
          lastCursor: products.length ? products?.[products.length - 1]?.id : -1,
          products: JSON.parse(JSON.stringify(products || [])),
          stories: JSON.parse(JSON.stringify([])),
        },
      },
      getStories: {
        options: {
          url: "/api/search/result/story",
          query: `keyword=${recentlyKeyword}&includeSold=${!excludeSold}&posX=${posX}&posY=${posY}&distance=${distance}`,
        },
        response: {
          success: true,
          totalCount: 0,
          lastCursor: stories.length ? stories?.[stories.length - 1]?.id : -1,
          products: JSON.parse(JSON.stringify([])),
          stories: JSON.parse(JSON.stringify(stories || [])),
        },
      },
    },
  };
});

export default Page;
