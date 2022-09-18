import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, Fragment, useMemo } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetUserModelsResponse, UserModelsEnum, UserModelsEnums, UserModelsContent } from "@api/user/[models]/[filter]";
import { UserProductsEnum, getUserProducts } from "@api/user/products/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductList from "@components/lists/productList";
import LikeProduct from "@components/groups/likeProduct";

const UserDetailModelsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable data: invisible
  const modelTypes: { key: string; isInfinite: boolean; models: UserModelsEnum; filter: UserModelsEnums[keyof UserModelsEnums]; caption: string; tabName: string }[] = [
    { key: "purchase", isInfinite: true, models: "products", filter: "purchase", caption: "구매내역", tabName: "구매내역" },
    { key: "like", isInfinite: true, models: "products", filter: "like", caption: "관심목록", tabName: "관심목록" },
  ];
  const currentType = modelTypes.find((type) => type.models === router?.query?.models?.toString() && type.filter === router?.query?.filter?.toString())!;

  // fetch data
  const { data, setSize } = useSWRInfinite<GetUserModelsResponse>((...arg: [index: number, previousPageData: GetUserModelsResponse]) => {
    const options = { url: currentType ? `/api/user/${currentType?.models}/${currentType?.filter}` : "" };
    return getKey<GetUserModelsResponse>(...arg, options);
  });

  // variable data: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const contents = useMemo(() => {
    if (!data) return {} as UserModelsContent;
    return data.reduce((acc, cur) => {
      Object.entries(cur)
        .filter(([key, values]) => Array.isArray(values) && values.length)
        .forEach(([key, values]) => (acc[key as UserModelsEnum] = [...(acc?.[key as UserModelsEnum] || []), ...values]));
      return acc;
    }, {} as UserModelsContent);
  }, [data]);

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  if (!user) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      <nav className="empty:hidden sticky top-12 left-0 flex bg-white border-b z-[1]">
        {modelTypes
          ?.filter((type) => type.key === currentType.key)
          ?.map((type, index, array) => {
            if (array.length < 2) return null;
            return (
              <Fragment key={`${type.models}-${type.filter}`}>
                <Link href={{ pathname: router.pathname, query: { models: type.models, filter: type.filter, id: router.query.id } }} replace passHref>
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
        <h2 className="sr-only">나의 {currentType.caption}</h2>

        {/* Models: Infinite */}
        {currentType.isInfinite && (
          <Fragment>
            {/* Models: List */}
            {Boolean(Object.keys(contents)?.length) && (
              <>
                {currentType.models === "products" && (
                  <ProductList list={contents?.products || []} className={`-mx-5 ${currentType.filter === "purchase" ? "border-b-2 divide-y-2" : ""}`}>
                    {currentType.filter === "like" ? <LikeProduct key="LikeProduct" /> : <></>}
                    {currentType.filter === "purchase" ? <FeedbackProduct key="FeedbackProduct" /> : <></>}
                  </ProductList>
                )}
                <span className="empty:hidden list-loading">
                  {isReachingEnd ? `${getPostposition(currentType.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentType.caption}을 불러오고있어요` : null}
                </span>
              </>
            )}

            {/* Models: Empty */}
            {!Boolean(Object.keys(contents)?.length) && (
              <p className="list-empty">
                <>{getPostposition(currentType.caption, "이;가")} 존재하지 않아요</>
              </p>
            )}
          </Fragment>
        )}

        {/* Models: Finite */}
        {/* {!currentType.isInfinite && <Fragment></Fragment>} */}

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
