import type { NextPage } from "next";
import { useRouter } from "next/router";
import NextError from "next/error";
import { useState, useEffect, Fragment } from "react";
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
import { GetProfilesDetailResponse, getProfilesDetail } from "@api/profiles/[id]";
import { GetProfilesModelsResponse, ProfileModelsEnum, ProfileModelsEnums, ProfileModelsContent } from "@api/profiles/[id]/[models]/[filter]";
import { ProfileProductsEnum, getProfilesProducts } from "@api/profiles/[id]/products/[filter]";
import { ProfileStoriesEnum, getProfilesStories } from "@api/profiles/[id]/stories/[filter]";
import { ProfileCommentsEnum, getProfilesComments } from "@api/profiles/[id]/comments/[filter]";
import { ProfileReviewsEnum, getProfilesReviews } from "@api/profiles/[id]/reviews/[filter]";
import { ProfileMannersEnum, getProfilesManners } from "@api/profiles/[id]/manners/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import TabList from "@components/groups/tabList";
import FeedbackProduct from "@components/groups/feedbackProduct";
import HandleProduct from "@components/groups/handleProduct";
import ProductList from "@components/lists/productList";
import StoryList from "@components/lists/storyList";
import PictureList from "@components/groups/pictureList";
import CommentSummaryList from "@components/lists/commentSummaryList";
import ReviewList from "@components/lists/reviewList";
import MannerList from "@components/lists/mannerList";
import Buttons from "@components/buttons";

const ProfilesDetailModelsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // variable: tabs
  const { list, listContainer, currentTab } = useRouterTabs({
    list: [
      { key: "products", isInfinite: true, models: "products", filter: "all", caption: "등록된 게시글", tabName: "전체" },
      { key: "products", isInfinite: true, models: "products", filter: "sale", caption: "판매 중인 게시글", tabName: "판매중" },
      { key: "products", isInfinite: true, models: "products", filter: "sold", caption: "판매 완료된 게시글", tabName: "판매완료" },
      { key: "stories", isInfinite: true, models: "stories", filter: "all", caption: "동네생활 게시글", tabName: "게시글" },
      { key: "stories", isInfinite: true, models: "comments", filter: "all", caption: "동네생활 댓글", tabName: "댓글" },
      { key: "reviews", isInfinite: true, models: "reviews", filter: "all", caption: "전체 매너 후기", tabName: "전체 후기" },
      { key: "reviews", isInfinite: true, models: "reviews", filter: "sellUser", caption: "판매자 매너 후기", tabName: "판매자 후기" },
      { key: "reviews", isInfinite: true, models: "reviews", filter: "purchaseUser", caption: "구매자 매너 후기", tabName: "구매자 후기" },
      { key: "manners", isInfinite: false, models: "manners", filter: "all", caption: "받은 매너 평가", tabName: "받은 매너 평가" },
    ],
  });

  // variable: invisible
  const [isValidProfile, setIsValidProfile] = useState(true);

  // fetch data
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router?.query?.id ? `/api/profiles/${router?.query?.id}?` : null);
  const { data, setSize, mutate } = useSWRInfinite<GetProfilesModelsResponse>((...arg: [index: number, previousPageData: GetProfilesModelsResponse]) => {
    const options = { url: router?.query?.id && currentTab ? `/api/profiles/${router?.query?.id}/${currentTab?.models}/${currentTab?.filter}` : "" };
    return getKey<GetProfilesModelsResponse>(...arg, options);
  });

  // variable: visible
  const { infiniteRef, isReachingEnd, isLoading, collection } = useInfiniteDataConverter<GetProfilesModelsResponse>({ data, setSize });

  // update: isValidProfile
  useEffect(() => {
    const isInvalid = {};
    // invalid
    if (!profileData?.success || !profileData?.profile || Object.values(isInvalid).includes(true)) {
      const profileId = router?.query?.id?.toString();
      let redirectDestination = null;
      router.replace(redirectDestination ?? `/profiles/${profileId}`);
      setIsValidProfile(false);
      return;
    }
    // valid
    setIsValidProfile(true);
  }, [profileData]);

  // reload: infinite list
  useEffect(() => {
    (async () => {
      if (!collection?.singleValue?.success && router.query.id) await mutate();
    })();
  }, [data, router.query.id]);

  if (!isValidProfile) {
    return <NextError statusCode={500} />;
  }

  return (
    <div className="">
      <TabList ref={listContainer} list={list} currentTab={currentTab} hrefPathname={router.pathname} hrefQuery={["models", "filter"]} hrefExtraQuery={{ id: router?.query?.id?.toString() || "" }} />

      <section className="container">
        <h2 className="sr-only">
          {profileData?.profile?.name}님의 {currentTab?.caption}
        </h2>

        {/* Models: Infinite */}
        {currentTab?.isInfinite && (
          <Fragment>
            {/* Models: List */}
            {Boolean(Object.keys(collection?.multiValues)?.length) && (
              <>
                {currentTab?.models === "products" && (
                  <ProductList list={collection?.multiValues?.products || []} className={`-mx-5 ${profileData?.profile.id === user?.id ? "border-b-2 divide-y-2" : ""}`}>
                    {profileData?.profile.id === user?.id ? <FeedbackProduct key="FeedbackProduct" /> : <></>}
                    {profileData?.profile.id === user?.id ? <HandleProduct key="HandleProduct" size="base" /> : <></>}
                  </ProductList>
                )}
                {currentTab?.models === "stories" && (
                  <StoryList list={collection?.multiValues?.stories || []} cardProps={{ summaryType: "report" }} className="-mx-5">
                    <PictureList key="PictureList" className="px-5 pb-3" />
                  </StoryList>
                )}
                {currentTab?.models === "comments" && <CommentSummaryList list={collection?.multiValues?.comments || []} className="-mx-5 border-b divide-y" />}
                {currentTab?.models === "reviews" && <ReviewList list={collection?.multiValues?.reviews || []} className="-mx-5 border-b divide-y" cardProps={{ className: "block px-5 pt-3 pb-3" }} />}
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
        {!currentTab?.isInfinite && (
          <Fragment>
            {/* Models: Manners */}
            {currentTab?.models === "manners" && (
              <div className="pt-5 pb-5 space-y-5">
                {[
                  { isRude: false, title: "받은 매너", emptyText: "받은 매너 칭찬이 아직 없어요" },
                  { isRude: true, title: "받은 비매너", emptyText: user?.id === profileData?.profile.id ? "받은 비매너가 없어요" : "받은 비매너는 본인에게만 보여요" },
                ]
                  .map((block) => ({ ...block, manners: collection?.multiValues?.manners?.filter((manner) => manner.isRude === block.isRude) || [] }))
                  .map((block) => (
                    <div key={block.title}>
                      <h3>{block.title}</h3>
                      {Boolean(block?.manners?.length) ? <MannerList className="mt-1" list={block?.manners} /> : <p className="mt-2">{block?.emptyText}</p>}
                    </div>
                  ))}

                {/* todo: 당근마켓 거래매너 보기 */}
                <div className="mt-5 pt-5 border-t">
                  <p className="text-center">
                    따뜻한 거래를 위한
                    <br />
                    당근마켓 거래매너를 확인해보세요
                  </p>
                  <Buttons tag="button" className="mt-5">
                    당근마켓 거래매너 보기
                  </Buttons>
                </div>
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
  getProfilesDetail: { options: { url: string; query: string }; response: GetProfilesDetailResponse };
  getProfilesModels: {
    options: { url: string; query: string };
    response: GetProfilesModelsResponse;
  };
}> = ({ getUser, getProfilesDetail, getProfilesModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProfilesDetail?.options?.url}?${getProfilesDetail?.options?.query}`]: getProfilesDetail.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesModelsResponse]) => getKey<GetProfilesModelsResponse>(...arg, getProfilesModels.options))]: [
            getProfilesModels.response,
          ],
        },
      }}
    >
      <ProfilesDetailModelsPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // params
  const models = (params?.models?.toString() as ProfileModelsEnum) || "";
  const filter = (params?.filter?.toString() as ProfileModelsEnums[keyof ProfileModelsEnums]) || "";
  const profileId = params?.id?.toString() || "";

  // invalidModels
  if (!models || !isInstance(models, ProfileModelsEnum)) {
    return {
      notFound: true,
    };
  }

  // invalidFilter
  if (!filter || !isInstance(filter, ProfileModelsEnums?.[models] || {})) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}/${models}/${Object.keys(ProfileModelsEnums?.[models])?.[0]}`,
      },
    };
  }

  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // getProfilesDetail
  const profilesDetail =
    profileId && !isNaN(+profileId)
      ? await getProfilesDetail({
          id: +profileId,
        })
      : {
          profile: null,
        };
  if (!profilesDetail?.profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // getProfilesProducts
  const profilesProducts =
    profilesDetail?.profile?.id && models === "products"
      ? await getProfilesProducts({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileProductsEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          products: [],
        };

  // getProfilesStories
  const profilesStories =
    profilesDetail?.profile?.id && models === "stories"
      ? await getProfilesStories({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileStoriesEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          stories: [],
        };

  // getProfilesComments
  const profilesComments =
    profilesDetail?.profile?.id && models === "comments"
      ? await getProfilesComments({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileCommentsEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          comments: [],
        };

  // getProfilesReviews
  const profilesReviews =
    profilesDetail?.profile?.id && models === "reviews"
      ? await getProfilesReviews({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileReviewsEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          reviews: [],
        };

  // getProfilesManners
  const profilesManners =
    profilesDetail?.profile?.id && models === "manners"
      ? await getProfilesManners({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileMannersEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
          userId: ssrUser?.profile?.id,
        })
      : {
          manners: [],
          rudeManners: [],
        };

  const profilesModels = {
    ...(models === "products" ? { title: "판매 상품", contents: profilesProducts } : {}),
    ...(models === "stories" ? { title: "동네생활", contents: profilesStories } : {}),
    ...(models === "comments" ? { title: "동네생활", contents: profilesComments } : {}),
    ...(models === "reviews" ? { title: "매너 후기", contents: profilesReviews } : {}),
    ...(models === "manners" ? { title: "매너 평가", contents: profilesManners } : {}),
  };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${profilesModels?.title} | ${profilesDetail?.profile?.name} | 프로필`,
    },
    header: {
      title: `${profilesDetail?.profile?.name}님의 ${profilesModels?.title}`,
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
      getProfilesDetail: {
        options: {
          url: `/api/profiles/${profileId}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesDetail || {})),
        },
      },
      getProfilesModels: {
        options: {
          url: `/api/profiles/${profileId}/${models}/${filter}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesModels?.contents || {})),
        },
      },
    },
  };
});

export default Page;
