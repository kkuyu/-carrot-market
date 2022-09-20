import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { Fragment, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import {  getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useRouterTabs from "@libs/client/useRouterTabs";
import useInfiniteDataConverter from "@libs/client/useInfiniteDataConverter";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetSearchResponse, getSearch, PostSearchResponse } from "@api/search";
import { GetSearchModelsResponse, SearchModelsEnum, SearchModelsEnums, SearchModelsContent } from "@api/search/result/[models]/[filter]";
import { SearchPreviewsEnum, getSearchPreviews } from "@api/search/result/previews/[filter]";
import { SearchProductsEnum, getSearchProducts } from "@api/search/result/products/[filter]";
import { SearchStoriesEnum, getSearchStories } from "@api/search/result/stories/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import TabList from "@components/groups/tabList";
import FilterProduct, { FilterProductTypes } from "@components/forms/filterProduct";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";
import PictureList from "@components/groups/pictureList";
import Buttons from "@components/buttons";

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr } = useUser();

  // variable: tabs
  const { list, listContainer, currentTab } = useRouterTabs({
    list: [
      { key: "results", isInfinite: false, models: "previews", filter: "preview", caption: "검색 결과", tabName: "통합" },
      { key: "results", isInfinite: true, models: "products", filter: "all", caption: "검색 결과", tabName: "중고 거래" },
      { key: "results", isInfinite: true, models: "stories", filter: "all", caption: "검색 결과", tabName: "동네생활" },
    ],
  });

  // variable: invisible
  const currentQueries = useMemo(() => {
    return {
      searchKeyword: router?.query?.keyword?.toString() || "",
    };
  }, [router?.query?.keyword]);

  // fetch data
  const { data: searchData, mutate: searchMutate } = useSWR<GetSearchResponse>("/api/search?");
  const { data, setSize, mutate } = useSWRInfinite<GetSearchModelsResponse>((...arg: [index: number, previousPageData: GetSearchModelsResponse]) => {
    const options = {
      url: currentTab ? `/api/search/result/${currentTab?.models}/${currentTab?.filter}` : "",
      query: currentQueries && currentAddr ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}&keyword=${currentQueries?.searchKeyword}` : "",
    };
    return getKey<GetSearchModelsResponse>(...arg, options);
  });

  // mutation data
  const [updateSearch, { loading: loadingSearch }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: async (data) => {
      window.scrollTo({ behavior: "smooth", top: 0 });
      await searchMutate();
      await setSize(0);
    },
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetSearchModelsResponse>({ data, setSize });

  // variable: form
  const formDataWithProduct = useForm<FilterProductTypes>();

  // update: search
  const submitFilterProduct = ({ includeSoldProducts, ...data }: FilterProductTypes) => {
    if (loadingSearch) return;
    updateSearch({
      ...data,
      searchFilter: {
        includeSoldProducts,
      },
    });
  };

  // update: formDataWithProduct
  useEffect(() => {
    formDataWithProduct.setValue("includeSoldProducts", searchData?.filter?.includeSoldProducts ?? false);
  }, [searchData?.filter]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!collection?.singleValue?.success && currentAddr && currentQueries) await mutate();
    })();
  }, [data, currentAddr, currentQueries]);

  return (
    <div className="">
      <TabList
        ref={listContainer}
        list={list}
        currentTab={currentTab}
        hrefPathname={router.pathname}
        hrefQuery={["models"]}
        hrefExtraQuery={{ keyword: currentQueries?.searchKeyword }}
      />

      <section className="container">
        <h1 className="sr-only">
          &apos;{currentQueries?.searchKeyword}&apos; {currentTab?.tabName} {currentTab?.caption}
        </h1>

        {/* Models: Infinite */}
        {currentTab?.isInfinite && (
          <Fragment>
            {/* Models: List */}
            {Boolean(Object.keys(collection?.multiValues)?.length) && (
              <>
                {currentTab?.models === "products" && (
                  <>
                    <FilterProduct formType="update" formData={formDataWithProduct} onValid={submitFilterProduct} isLoading={loadingSearch} className="pt-3 fixed bottom-0 left-0 bg-lime-300 z-50 " />
                    <ProductList list={collection?.multiValues?.products || []} cardProps={{ highlightWord: currentQueries?.searchKeyword }} className="-mx-5" />
                  </>
                )}
                {currentTab?.models === "stories" && (
                  <StoryList list={collection?.multiValues?.stories || []} cardProps={{ summaryType: "report", highlightWord: currentQueries?.searchKeyword }} className="-mx-5">
                    <PictureList key="PictureList" className="px-5 pb-3" />
                  </StoryList>
                )}
                <span className="empty:hidden list-loading">
                  {isReachingEnd ? `${getPostposition(currentTab?.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentTab?.caption}을 불러오고있어요` : null}
                </span>
              </>
            )}

            {/* Models: Empty */}
            {!Boolean(Object.keys(collection?.multiValues)?.length) && (
              <p className="list-empty">
                앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
                <br />
                &apos;{currentQueries?.searchKeyword}&apos; {getPostposition(currentTab?.caption, "이;가")} 없어요
              </p>
            )}
          </Fragment>
        )}

        {/* Models: Finite */}
        {!currentTab?.isInfinite && (
          <Fragment>
            {/* Models: Previews */}
            {currentTab?.models === "previews" && (
              <div>
                {Boolean(collection?.multiValues?.products?.length) && (
                  <div className="pt-3 last:pb-2">
                    <h2>중고 거래</h2>
                    <ProductList list={collection?.multiValues?.products || []} cardProps={{ highlightWord: currentQueries?.searchKeyword }} className="-mx-5 border-b-0" />
                    {(collection?.singleValue?.previews?.counts?.products || 0) > (collection?.multiValues?.products?.length || 0) && (
                      <Link href={{ pathname: router.pathname, query: { models: "products", keyword: currentQueries?.searchKeyword } }} replace passHref>
                        <Buttons tag="a" status="default" size="base" className="mt-1.5">
                          중고 거래 더보기
                        </Buttons>
                      </Link>
                    )}
                  </div>
                )}

                {Boolean(collection?.multiValues?.stories?.length) && (
                  <div className="pt-3 last:pb-2">
                    <h2>동네생활</h2>
                    <StoryList list={collection?.multiValues?.stories || []} cardProps={{ summaryType: "report", highlightWord: currentQueries?.searchKeyword }} className="-mx-5 border-b-0">
                      <PictureList key="PictureList" className="px-5 pb-3" />
                    </StoryList>
                    {(collection?.singleValue?.previews?.counts?.stories || 0) > (collection?.multiValues?.stories?.length || 0) && (
                      <Link href={{ pathname: router.pathname, query: { models: "stories", keyword: currentQueries?.searchKeyword } }} replace passHref>
                        <Buttons tag="a" status="default" size="base" className="mt-1.5">
                          동네생활 더보기
                        </Buttons>
                      </Link>
                    )}
                  </div>
                )}

                {!Boolean(collection?.multiValues?.products?.length) && !Boolean(collection?.multiValues?.stories?.length) && (
                  <p className="list-empty">
                    앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
                    <br />
                    &apos;{currentQueries?.searchKeyword}&apos; {getPostposition(currentTab?.caption, "이;가")} 없어요
                  </p>
                )}
              </div>
            )}
          </Fragment>
        )}

        {/* Models: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />
      </section>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getSearch: { options: { url: string; query: string }; response: GetSearchResponse };
  getSearchModels: {
    options: { url: string; query: string };
    response: GetSearchModelsResponse;
  };
}> = ({ getUser, getSearch, getSearchModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getSearch?.options?.url}?${getSearch?.options?.query}`]: getSearch.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetSearchModelsResponse]) => getKey<GetSearchModelsResponse>(...arg, getSearchModels.options))]: [getSearchModels.response],
        },
      }}
    >
      <SearchPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params, query }) => {
  // params
  const models = (params?.models?.toString() as SearchModelsEnum) || "";
  const filter = ((models === "previews" ? "preview" : "all") as SearchModelsEnums[keyof SearchModelsEnums]) || "";
  const searchKeyword = query?.keyword?.toString() || "";

  // invalidKeyword
  if (!searchKeyword) {
    return {
      redirect: {
        permanent: false,
        destination: `/search`,
      },
    };
  }

  // invalidModels
  if (!models || !isInstance(models, SearchModelsEnum)) {
    return {
      notFound: true,
    };
  }

  // invalidFilter
  if (!filter || !isInstance(filter, SearchModelsEnums?.[models] || {})) {
    return {
      notFound: true,
    };
  }

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // getSearch
  const searchData = await getSearch({
    search: req?.session?.search,
  });

  // params
  const searchFilter = req?.session?.search?.filter ?? {};
  const posX = ssrUser?.currentAddr?.emdPosX;
  const posY = ssrUser?.currentAddr?.emdPosY;
  const distance = ssrUser?.currentAddr?.emdPosDx;

  // getSearchPreviews
  const searchPreviews =
    models === "previews" && posX && posY && distance
      ? await getSearchPreviews({
          searchFilter,
          filter: filter as Extract<SearchModelsEnums[keyof SearchModelsEnums], SearchPreviewsEnum>,
          keyword: searchKeyword,
          prevCursor: 0,
          distance,
          posX,
          posY,
        })
      : {
          totalCount: 0,
          products: [],
          stories: [],
        };

  // getSearchProducts
  const searchProducts =
    models === "products" && posX && posY && distance
      ? await getSearchProducts({
          searchFilter,
          filter: filter as Extract<SearchModelsEnums[keyof SearchModelsEnums], SearchProductsEnum>,
          keyword: searchKeyword,
          prevCursor: 0,
          distance,
          posX,
          posY,
        })
      : {
          totalCount: 0,
          products: [],
        };

  // getSearchStories
  const searchStories =
    models === "stories" && posX && posY && distance
      ? await getSearchStories({
          searchFilter,
          filter: filter as Extract<SearchModelsEnums[keyof SearchModelsEnums], SearchStoriesEnum>,
          keyword: searchKeyword,
          prevCursor: 0,
          distance,
          posX,
          posY,
        })
      : {
          totalCount: 0,
          products: [],
        };

  const searchModels = {
    ...(models === "previews" ? { title: "통합 검색", contents: searchPreviews } : {}),
    ...(models === "products" ? { title: "중고 거래", contents: searchProducts } : {}),
    ...(models === "stories" ? { title: "동네생활", contents: searchStories } : {}),
  };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${searchKeyword} | ${searchModels?.title} | 검색 결과`,
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
      getUser: {
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
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
      getSearchModels: {
        options: {
          url: `/api/search/result/${models}/${filter}`,
          query: `posX=${posX}&posY=${posY}&distance=${distance}&keyword=${searchKeyword}`,
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(searchModels?.contents || {})),
        },
      },
    },
  };
});

export default Page;
