import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, Fragment } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { UserModelsEnum, UsersDetailModels } from "@api/user/types";
import { GetUserResponse, getUser } from "@api/user";
import { GetUserDetailProductsResponse, UserProductsFilterEnum, getUserDetailProducts } from "@api/user/products/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import FeedbackProduct from "@components/groups/feedbackProduct";
import ProductList from "@components/lists/productList";
import LikeProduct from "@components/groups/likeProduct";

type GetUserDetailModelsResponse = GetUserDetailProductsResponse;

const UserDetailModelsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable data: invisible
  const modelTypes: { key: string; isInfinite: boolean; models: UserModelsEnum; filter: UsersDetailModels[keyof UsersDetailModels]; caption: string; tabName: string }[] = [
    { key: "purchase", isInfinite: true, models: "products", filter: "purchase", caption: "구매내역", tabName: "구매내역" },
    { key: "like", isInfinite: true, models: "products", filter: "like", caption: "관심목록", tabName: "관심목록" },
  ];
  const currentType = modelTypes.find((type) => type.models === router?.query?.models?.toString() && type.filter === router?.query?.filter?.toString())!;

  // fetch data
  const { data, setSize } = useSWRInfinite<GetUserDetailModelsResponse>((...arg: [index: number, previousPageData: GetUserDetailModelsResponse]) => {
    const options = { url: currentType?.models && currentType?.filter ? `/api/user/${currentType?.models}/${currentType?.filter}` : "" };
    return getKey<GetUserDetailModelsResponse>(...arg, options);
  });

  // variable data: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const contents = data ? data.flatMap((item) => item?.[currentType.models]) : null;

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

        {/* Models: List */}
        {contents && Boolean(contents.length) && currentType.isInfinite && (
          <>
            {currentType.models === "products" && (
              <ProductList list={contents} className={`-mx-5 ${currentType.filter === "purchase" ? "border-b-2 divide-y-2" : ""}`}>
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
        {contents && !Boolean(contents.length) && currentType.isInfinite && (
          <p className="list-empty">
            <>{getPostposition(currentType.caption, "이;가")} 존재하지 않아요</>
          </p>
        )}

        {/* Models: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />
      </section>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getUserDetailModels: {
    options: { url: string; query: string };
    response: GetUserDetailModelsResponse;
  };
}> = ({ getUser, getUserDetailModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetUserDetailModelsResponse]) => getKey<GetUserDetailModelsResponse>(...arg, getUserDetailModels.options))]: [
            getUserDetailModels.response,
          ],
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
  const filter = (params?.filter?.toString() as UsersDetailModels[keyof UsersDetailModels]) || "";
  const profileId = params?.id?.toString() || "";

  // invalidModels
  if (!models || !isInstance(models, UserModelsEnum)) {
    return {
      notFound: true,
    };
  }

  // invalidFilter
  if (!filter || !isInstance(filter, UsersDetailModels?.[models] || {})) {
    return {
      redirect: {
        permanent: false,
        destination: `/user/${profileId}/${models}/${Object.keys(UsersDetailModels?.[models])?.[0]}`,
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

  // UserDetailProducts
  const userDetailProducts =
    ssrUser?.profile?.id && !isNaN(+ssrUser?.profile?.id)
      ? await getUserDetailProducts({
          filter: filter as Extract<UsersDetailModels[keyof UsersDetailModels], UserProductsFilterEnum>,
          prevCursor: 0,
          userId: ssrUser?.profile?.id,
        })
      : {
          totalCount: 0,
          products: [],
        };

  const userDetailModels = {
    ...(models === "products" && filter === "purchase" ? { title: "구매내역", contents: userDetailProducts } : {}),
    ...(models === "products" && filter === "like" ? { title: "관심목록", contents: userDetailProducts } : {}),
  };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${userDetailModels?.title} | 나의 당근`,
    },
    header: {
      title: `${userDetailModels?.title}`,
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
      getUserDetailModels: {
        options: {
          url: `/api/user/${models}/${filter}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(userDetailModels?.contents || {})),
        },
      },
    },
  };
});

export default Page;
