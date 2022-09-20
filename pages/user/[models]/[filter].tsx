import type { NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useEffect, Fragment } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useRouterTabs from "@libs/client/useRouterTabs";
import useInfiniteDataConverter from "@libs/client/useInfiniteDataConverter";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetUserModelsResponse, UserModelsEnum, UserModelsEnums, UserModelsContent } from "@api/user/[models]/[filter]";
import { UserProductsEnum, getUserProducts } from "@api/user/products/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import TabList from "@components/groups/tabList";
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductList from "@components/lists/productList";
import LikeProduct from "@components/groups/likeProduct";

const UserDetailModelsPage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType, mutate: mutateUser } = useUser();

  // variable: tabs
  const { list, listContainer, currentTab } = useRouterTabs({
    list: [
      { key: "purchase", isInfinite: true, models: "products", filter: "purchase", caption: "구매내역", tabName: "구매내역" },
      { key: "like", isInfinite: true, models: "products", filter: "like", caption: "관심목록", tabName: "관심목록" },
    ],
  });

  // fetch data
  const { data, setSize, mutate } = useSWRInfinite<GetUserModelsResponse>((...arg: [index: number, previousPageData: GetUserModelsResponse]) => {
    const options = { url: currentTab ? `/api/user/${currentTab?.models}/${currentTab?.filter}` : "" };
    return getKey<GetUserModelsResponse>(...arg, options);
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetUserModelsResponse>({ data, setSize });

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (userType === "guest") await mutateUser();
      if (!collection?.singleValue?.success && userType === "member") await mutate();
    })();
  }, [data, userType]);

  if (userType !== "member") {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      <TabList ref={listContainer} list={list} currentTab={currentTab} hrefPathname={router.pathname} hrefQuery={["models", "filter"]} hrefExtraQuery={{ id: router.query.id?.toString() || "" }} />

      <section className="container">
        <h2 className="sr-only">나의 {currentTab?.caption}</h2>

        {/* Models: Infinite */}
        {currentTab?.isInfinite && (
          <Fragment>
            {/* Models: List */}
            {Boolean(Object.keys(collection?.multiValues)?.length) && (
              <>
                {currentTab?.models === "products" && (
                  <ProductList list={collection?.multiValues?.products || []} className={`-mx-5 ${currentTab?.filter === "purchase" ? "border-b-2 divide-y-2" : ""}`}>
                    {currentTab?.filter === "like" ? <LikeProduct key="LikeProduct" /> : <></>}
                    {currentTab?.filter === "purchase" ? <FeedbackProduct key="FeedbackProduct" /> : <></>}
                  </ProductList>
                )}
                <span className="empty:hidden list-loading">
                  {isReachingEnd ? `${getPostposition(currentTab?.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentTab?.caption}을 불러오고있어요` : null}
                </span>
              </>
            )}

            {/* Models: Empty */}
            {!Boolean(Object.keys(collection?.multiValues)?.length) && (
              <p className="list-empty">
                <>{getPostposition(currentTab?.caption, "이;가")} 존재하지 않아요</>
              </p>
            )}
          </Fragment>
        )}

        {/* Models: Finite */}
        {/* {!currentTab?.isInfinite && <Fragment></Fragment>} */}

        {/* Models: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />
      </section>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getUserModels: {
    options: { url: string; query: string };
    response: GetUserModelsResponse;
  };
}> = ({ getUser, getUserModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetUserModelsResponse]) => getKey<GetUserModelsResponse>(...arg, getUserModels.options))]: [getUserModels.response],
        },
      }}
    >
      <UserDetailModelsPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const models = (params?.models?.toString() as UserModelsEnum) || "";
  const filter = (params?.filter?.toString() as UserModelsEnums[keyof UserModelsEnums]) || "";
  const profileId = params?.id?.toString() || "";

  // invalidModels
  if (!models || !isInstance(models, UserModelsEnum)) {
    return {
      notFound: true,
    };
  }

  // invalidFilter
  if (!filter || !isInstance(filter, UserModelsEnums?.[models] || {})) {
    return {
      redirect: {
        permanent: false,
        destination: `/user/${profileId}/${models}/${Object.keys(UserModelsEnums?.[models])?.[0]}`,
      },
    };
  }

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/user`
  if (!ssrUser?.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/user`,
      },
    };
  }

  // userProducts
  const userProducts =
    ssrUser?.profile?.id && !isNaN(+ssrUser?.profile?.id)
      ? await getUserProducts({
          filter: filter as Extract<UserModelsEnums[keyof UserModelsEnums], UserProductsEnum>,
          prevCursor: 0,
          userId: ssrUser?.profile?.id,
        })
      : {
          totalCount: 0,
          products: [],
        };

  const userModels = {
    ...(models === "products" && filter === "purchase" ? { title: "구매내역", contents: userProducts } : {}),
    ...(models === "products" && filter === "like" ? { title: "관심목록", contents: userProducts } : {}),
  };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${userModels?.title} | 나의 당근`,
    },
    header: {
      title: `${userModels?.title}`,
      titleTag: "h1",
      utils: ["back", "title"],
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
      getUserModels: {
        options: {
          url: `/api/user/${models}/${filter}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(userModels?.contents || {})),
        },
      },
    },
  };
});

export default Page;
