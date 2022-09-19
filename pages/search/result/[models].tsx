import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { Fragment, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetSearchResponse, PostSearchResponse } from "@api/search";
import { GetSearchModelsResponse, SearchModelsEnum, SearchModelsEnums, SearchModelsContent } from "@api/search/result/[models]/[filter]";
import { SearchPreviewsEnum, getSearchPreviews } from "@api/search/result/previews/[filter]";
import { SearchProductsEnum, getSearchProducts } from "@api/search/result/products/[filter]";
import { SearchStoriesEnum, getSearchStories } from "@api/search/result/stories/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FilterProduct, { FilterProductTypes } from "@components/forms/filterProduct";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";
import PictureList from "@components/groups/pictureList";
import Buttons from "@components/buttons";

const SearchPage: NextPage = () => {
  const router = useRouter();
  const { currentAddr, type: userType } = useUser();

  // variable data: invisible
  const modelTypes: { key: string; isInfinite: boolean; models: SearchModelsEnum; filter: SearchModelsEnums[keyof SearchModelsEnums]; caption: string; tabName: string }[] = [
    { key: "results", isInfinite: false, models: "previews", filter: "preview", caption: "검색 결과", tabName: "통합" },
    { key: "results", isInfinite: true, models: "products", filter: "all", caption: "검색 결과", tabName: "중고 거래" },
    { key: "results", isInfinite: true, models: "stories", filter: "all", caption: "검색 결과", tabName: "동네생활" },
  ];
  const currentType = modelTypes.find((type) => type.models === router?.query?.models?.toString())!;
  const currentKeyword = router?.query?.keyword?.toString() || "";

  // fetch data
  const { data: searchData, mutate: searchMutate } = useSWR<GetSearchResponse>("/api/search?");
  const { data, setSize, mutate } = useSWRInfinite<GetSearchModelsResponse>((...arg: [index: number, previousPageData: GetSearchModelsResponse]) => {
    const options = {
      url: currentType ? `/api/search/result/${currentType?.models}/${currentType?.filter}` : "",
      query: currentType && currentKeyword && currentAddr ? `posX=${currentAddr?.emdPosX}&posY=${currentAddr?.emdPosY}&distance=${currentAddr?.emdPosDx}&keyword=${currentKeyword}` : "",
    };
    return getKey<GetSearchModelsResponse>(...arg, options);
  });

  // mutation data
  const [updateSearch, { loading: loadingSearch }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: async (data) => {
      const models = router?.query?.models || "previews";
      const [{ keyword }] = data?.history;
      if (router.pathname === "/search/result/[models]") {
        if (router?.query?.keyword?.toString() === keyword) {
          await searchMutate();
          await mutate();
          window.scrollTo({ behavior: "smooth", top: 0 });
        } else {
          await router.replace({ pathname: "/search/result/[models]", query: { models, keyword } });
        }
      } else {
        await router.push({ pathname: "/search/result/[models]", query: { models, keyword } });
      }
    },
  });

  // variable: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const contents = useMemo(() => {
    if (!data) return {} as SearchModelsContent;
    return data.reduce((acc, { previews, ...cur }) => {
      if (previews?.counts) acc.previews = previews;
      Object.entries(cur)
        .filter(([key, values]) => Array.isArray(values) && values.length)
        .forEach(([key, values]) => (acc[key as Exclude<SearchModelsEnum, "previews">] = [...(acc?.[key as Exclude<SearchModelsEnum, "previews">] || []), ...values]));
      return acc;
    }, {} as SearchModelsContent);
  }, [data]);

  // variable: form
  const formDataWithProduct = useForm<FilterProductTypes>({
    defaultValues: {
      includeSoldProducts: searchData?.filter?.includeSoldProducts ?? false,
    },
  });

  // update: search
  const submitFilterProduct = (data: FilterProductTypes) => {
    if (loadingSearch) return;
    updateSearch({ searchFilter: { ...data } });
  };

  // update: formDataWithProduct
  useEffect(() => {
    if (searchData && Object.keys(searchData?.filter)?.length) {
      formDataWithProduct.setValue("includeSoldProducts", searchData?.filter?.includeSoldProducts ?? false);
    }
  }, [searchData?.filter]);

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  return (
    <div className="">
      <nav className="empty:hidden sticky top-12 left-0 flex bg-white border-b z-[1]">
        {modelTypes
          ?.filter((type) => type.key === currentType.key)
          ?.map((type, index, array) => {
            if (array.length < 2) return null;
            return (
              <Fragment key={`${type.models}-${type.filter}`}>
                <Link href={{ pathname: router.pathname, query: { models: type.models, keyword: currentKeyword } }} replace passHref>
                  <a className={`basis-full py-2 text-sm text-center font-semibold ${type.models === currentType.models && type.filter === currentType.filter ? "text-black" : "text-gray-500"}`}>
                    {type.tabName}
                  </a>
                </Link>
                {index === array.length - 1 ? (
                  <span
                    className="absolute bottom-0 left-0 h-[2px] bg-black transition-transform"
                    style={{ width: `${100 / array.length}%`, transform: `translateX(${100 * array.findIndex((type) => type.models === currentType.models && type.filter === currentType.filter)}%)` }}
                  />
                ) : null}
              </Fragment>
            );
          })}
      </nav>
      <section className="container">
        <h1 className="sr-only">
          &apos;{currentKeyword}&apos; {currentType.tabName} {currentType.caption}
        </h1>

        {/* Models: Infinite */}
        {currentType.isInfinite && (
          <Fragment>
            {/* Models: List */}
            {Boolean(Object.keys(contents)?.length) && (
              <>
                {currentType.models === "products" && (
                  <>
                    <FilterProduct formType="update" formData={formDataWithProduct} onValid={submitFilterProduct} isLoading={loadingSearch} className="pt-3" />
                    <ProductList list={contents?.products || []} cardProps={{ highlightWord: currentKeyword }} className="-mx-5" />
                  </>
                )}
                {currentType.models === "stories" && (
                  <StoryList list={contents?.stories || []} cardProps={{ summaryType: "report", highlightWord: currentKeyword }} className="-mx-5">
                    <PictureList key="PictureList" className="px-5 pb-3" />
                  </StoryList>
                )}
                <span className="empty:hidden list-loading">
                  {isReachingEnd ? `${getPostposition(currentType.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentType.caption}을 불러오고있어요` : null}
                </span>
              </>
            )}

            {/* Models: Empty */}
            {!Boolean(Object.keys(contents)?.length) && (
              <p className="list-empty">
                앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
                <br />
                &apos;{currentKeyword}&apos; {getPostposition(currentType.caption, "이;가")} 없어요
              </p>
            )}
          </Fragment>
        )}

        {/* Models: Finite */}
        {!currentType.isInfinite && (
          <Fragment>
            {/* Models: Previews */}
            {currentType.models === "previews" && (
              <div>
                {Boolean(contents?.products?.length) && (
                  <div className="pt-3 last:pb-2">
                    <h2>중고 거래</h2>
                    <ProductList list={contents?.products || []} cardProps={{ highlightWord: currentKeyword }} className="-mx-5 border-b-0" />
                    {(contents?.previews?.counts?.products || 0) > (contents?.products?.length || 0) && (
                      <Link href={{ pathname: router.pathname, query: { models: "products", keyword: currentKeyword } }} replace passHref>
                        <Buttons tag="a" status="default" size="base" className="mt-1.5">
                          중고 거래 더보기
                        </Buttons>
                      </Link>
                    )}
                  </div>
                )}

                {Boolean(contents?.stories?.length) && (
                  <div className="pt-3 last:pb-2">
                    <h2>동네생활</h2>
                    <StoryList list={contents?.stories || []} cardProps={{ summaryType: "report", highlightWord: currentKeyword }} className="-mx-5 border-b-0">
                      <PictureList key="PictureList" className="px-5 pb-3" />
                    </StoryList>
                    {(contents?.previews?.counts?.stories || 0) > (contents?.stories?.length || 0) && (
                      <Link href={{ pathname: router.pathname, query: { models: "stories", keyword: currentKeyword } }} replace passHref>
                        <Buttons tag="a" status="default" size="base" className="mt-1.5">
                          동네생활 더보기
                        </Buttons>
                      </Link>
                    )}
                  </div>
                )}

                {!Boolean(contents?.products?.length) && !Boolean(contents?.stories?.length) && (
                  <p className="list-empty">
                    앗! {currentAddr.emdPosNm ? `${currentAddr.emdPosNm} 근처에는` : "근처에"}
                    <br />
                    &apos;{currentKeyword}&apos; {getPostposition(currentType.caption, "이;가")} 없어요
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
  getSearchModels: {
    options: { url: string; query: string };
    response: GetSearchModelsResponse;
  };
}> = ({ getUser, getSearchModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
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
  const keyword = query?.keyword?.toString() || "";

  // invalidKeyword
  if (!keyword) {
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
          keyword,
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
          keyword,
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
          keyword,
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
      title: `${keyword} | ${searchModels?.title} | 검색 결과`,
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
      getSearchModels: {
        options: {
          url: `/api/search/result/${models}/${filter}`,
          query: `posX=${posX}&posY=${posY}&distance=${distance}&keyword=${keyword}`,
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
