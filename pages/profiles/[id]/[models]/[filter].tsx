import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useState, useEffect, Fragment, useMemo } from "react";
import useSWR, { SWRConfig } from "swr";
import useSWRInfinite, { unstable_serialize } from "swr/infinite";
// @lib
import { getKey, getPostposition, isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useOnScreen from "@libs/client/useOnScreen";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, getUser } from "@api/user";
import { GetProfilesDetailResponse, getProfilesDetail } from "@api/profiles/[id]";
import { GetProfilesDetailModelsResponse, ProfileModelsEnum, ProfileModelsEnums, ProfilesDetailContents } from "@api/profiles/[id]/[manners]/[filter]";
import { ProfileProductsFilterEnum, getProfilesDetailProducts } from "@api/profiles/[id]/products/[filter]";
import { ProfileStoriesFilterEnum, getProfilesDetailStories } from "@api/profiles/[id]/stories/[filter]";
import { ProfileCommentsFilterEnum, getProfilesDetailComments } from "@api/profiles/[id]/comments/[filter]";
import { ProfileReviewsFilterEnum, getProfilesDetailReviews } from "@api/profiles/[id]/reviews/[filter]";
import { ProfileMannersFilterEnum, getProfilesDetailManners } from "@api/profiles/[id]/manners/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
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

  // variable data: invisible
  const [isValidProfile, setIsValidProfile] = useState(true);
  const modelTypes: { key: string; isInfinite: boolean; models: ProfileModelsEnum; filter: ProfileModelsEnums[keyof ProfileModelsEnums]; caption: string; tabName: string }[] = [
    { key: "products", isInfinite: true, models: "products", filter: "all", caption: "등록된 게시글", tabName: "전체" },
    { key: "products", isInfinite: true, models: "products", filter: "sale", caption: "판매 중인 게시글", tabName: "판매중" },
    { key: "products", isInfinite: true, models: "products", filter: "sold", caption: "판매 완료된 게시글", tabName: "판매완료" },
    { key: "stories", isInfinite: true, models: "stories", filter: "all", caption: "동네생활 게시글", tabName: "게시글" },
    { key: "stories", isInfinite: true, models: "comments", filter: "all", caption: "동네생활 댓글", tabName: "댓글" },
    { key: "reviews", isInfinite: true, models: "reviews", filter: "all", caption: "전체 매너 후기", tabName: "전체 후기" },
    { key: "reviews", isInfinite: true, models: "reviews", filter: "sellUser", caption: "판매자 매너 후기", tabName: "판매자 후기" },
    { key: "reviews", isInfinite: true, models: "reviews", filter: "purchaseUser", caption: "구매자 매너 후기", tabName: "구매자 후기" },
    { key: "manners", isInfinite: false, models: "manners", filter: "all", caption: "받은 매너 평가", tabName: "받은 매너 평가" },
  ];
  const currentType = modelTypes.find((type) => type.models === router?.query?.models?.toString() && type.filter === router?.query?.filter?.toString())!;

  // fetch data
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router?.query?.id ? `/api/profiles/${router?.query?.id}?` : null);
  const { data, setSize } = useSWRInfinite<GetProfilesDetailModelsResponse>((...arg: [index: number, previousPageData: GetProfilesDetailModelsResponse]) => {
    const options = { url: router?.query?.id && currentType?.models && currentType?.filter ? `/api/profiles/${router?.query?.id}/${currentType?.models}/${currentType?.filter}` : "" };
    return getKey<GetProfilesDetailModelsResponse>(...arg, options);
  });

  // variable data: visible
  const { infiniteRef, isVisible } = useOnScreen({ rootMargin: "55px" });
  const isReachingEnd = data && data?.[data.length - 1].lastCursor === -1;
  const isLoading = data && typeof data[data.length - 1] === "undefined";
  const contents = useMemo(() => {
    if (!data) return {} as ProfilesDetailContents;
    return data.reduce((acc, cur) => {
      Object.entries(cur)
        .filter(([key, values]) => Array.isArray(values) && values.length)
        .forEach(([key, values]) => (acc[key as ProfileModelsEnum] = [...(acc?.[key as ProfileModelsEnum] || []), ...values]));
      return acc;
    }, {} as ProfilesDetailContents);
  }, [data]);

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

  // update: infinite list
  useEffect(() => {
    if (isVisible && !isReachingEnd) setSize((size) => size + 1);
  }, [isVisible, isReachingEnd]);

  if (!isValidProfile) {
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
        <h2 className="sr-only">
          {profileData?.profile?.name}님의 {currentType.caption}
        </h2>

        {/* Models: List */}
        {currentType.isInfinite && Boolean(contents?.[currentType.models]?.length) && (
          <>
            {currentType.models === "products" && (
              <ProductList list={contents?.products || []} className={`-mx-5 ${profileData?.profile.id === user?.id ? "border-b-2 divide-y-2" : ""}`}>
                {profileData?.profile.id === user?.id ? <FeedbackProduct key="FeedbackProduct" /> : <></>}
                {profileData?.profile.id === user?.id ? <HandleProduct key="HandleProduct" size="base" /> : <></>}
              </ProductList>
            )}
            {currentType.models === "stories" && (
              <StoryList list={contents?.stories || []} cardProps={{ summaryType: "report" }} className="-mx-5">
                <PictureList key="PictureList" className="px-5 pb-3" />
              </StoryList>
            )}
            {currentType.models === "comments" && <CommentSummaryList list={contents?.comments || []} className="-mx-5 border-b divide-y" />}
            {currentType.models === "reviews" && <ReviewList list={contents?.reviews || []} className="-mx-5 border-b divide-y" cardProps={{ className: "block px-5 pt-3 pb-3" }} />}
            <span className="empty:hidden list-loading">
              {isReachingEnd ? `${getPostposition(currentType.caption, "을;를")} 모두 확인하였어요` : isLoading ? `${currentType.caption}을 불러오고있어요` : null}
            </span>
          </>
        )}

        {/* Models: Empty */}
        {currentType.isInfinite && !Boolean(contents?.[currentType.models]?.length) && (
          <p className="list-empty">
            <>{getPostposition(currentType.caption, "이;가")} 존재하지 않아요</>
          </p>
        )}

        {/* Models: Manners */}
        {!currentType.isInfinite && currentType.models === "manners" && (
          <div className="pt-5 pb-5 space-y-5">
            {[
              { isRude: false, title: "받은 매너", emptyText: "받은 매너 칭찬이 아직 없어요" },
              { isRude: true, title: "받은 비매너", emptyText: user?.id === profileData?.profile.id ? "받은 비매너가 없어요" : "받은 비매너는 본인에게만 보여요" },
            ]
              .map((block) => ({ ...block, manners: contents?.manners?.filter((manner) => manner.isRude === block.isRude) || [] }))
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

        {/* Models: InfiniteRef */}
        <div id="infiniteRef" ref={infiniteRef} />
      </section>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
  getProfilesDetail: { options: { url: string; query: string }; response: GetProfilesDetailResponse };
  getProfilesDetailModels: {
    options: { url: string; query: string };
    response: GetProfilesDetailModelsResponse;
  };
}> = ({ getUser, getProfilesDetail, getProfilesDetailModels }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
          [`${getProfilesDetail?.options?.url}?${getProfilesDetail?.options?.query}`]: getProfilesDetail.response,
          [unstable_serialize((...arg: [index: number, previousPageData: GetProfilesDetailModelsResponse]) => getKey<GetProfilesDetailModelsResponse>(...arg, getProfilesDetailModels.options))]: [
            getProfilesDetailModels.response,
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

  // getProfilesDetailProducts
  const profilesDetailProducts =
    profilesDetail?.profile?.id && models === "products"
      ? await getProfilesDetailProducts({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileProductsFilterEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          products: [],
        };

  // getProfilesDetailStories
  const profilesDetailStories =
    profilesDetail?.profile?.id && models === "stories"
      ? await getProfilesDetailStories({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileStoriesFilterEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          stories: [],
        };

  // getProfilesDetailComments
  const profilesDetailComments =
    profilesDetail?.profile?.id && models === "comments"
      ? await getProfilesDetailComments({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileCommentsFilterEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          comments: [],
        };

  // getProfilesDetailReviews
  const profilesDetailReviews =
    profilesDetail?.profile?.id && models === "reviews"
      ? await getProfilesDetailReviews({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileReviewsFilterEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
        })
      : {
          totalCount: 0,
          reviews: [],
        };

  // getProfilesDetailManners
  const profilesDetailManners =
    profilesDetail?.profile?.id && models === "manners"
      ? await getProfilesDetailManners({
          filter: filter as Extract<ProfileModelsEnums[keyof ProfileModelsEnums], ProfileMannersFilterEnum>,
          id: profilesDetail?.profile?.id,
          prevCursor: 0,
          userId: ssrUser?.profile?.id,
        })
      : {
          manners: [],
          rudeManners: [],
        };

  const profilesDetailModels = (() => {
    if (models === "products") return { title: "판매 상품", contents: profilesDetailProducts };
    if (models === "stories") return { title: "판매 상품", contents: profilesDetailStories };
    if (models === "comments") return { title: "판매 상품", contents: profilesDetailComments };
    if (models === "reviews") return { title: "판매 상품", contents: profilesDetailReviews };
    if (models === "manners") return { title: "판매 상품", contents: profilesDetailManners };
    return { title: "", contents: {} };
  })();

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${profilesDetailModels?.title} | ${profilesDetail?.profile?.name} | 프로필`,
    },
    header: {
      title: `${profilesDetail?.profile?.name}님의 ${profilesDetailModels?.title}`,
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
      getProfilesDetailModels: {
        options: {
          url: `/api/profiles/${profileId}/${models}/${filter}`,
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesDetailModels?.contents || {})),
        },
      },
    },
  };
});

export default Page;
