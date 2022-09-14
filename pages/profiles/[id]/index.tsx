import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import useSWR, { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
// @api
import { ProfileConcerns } from "@api/profiles/types";
import { GetProfilesDetailResponse, getProfilesDetail } from "@api/profiles/[id]";
import { GetProfilesDetailMannersResponse, getProfilesDetailManners } from "@api/profiles/[id]/manners/[filter]";
import { GetProfilesDetailReviewsResponse, getProfilesDetailReviews } from "@api/profiles/[id]/reviews/[filter]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Profiles from "@components/profiles";
import MannerList from "@components/lists/mannerList";
import ReviewList from "@components/lists/reviewList";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

const ProfilesDetailPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();

  // fetch data
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}?` : null);
  const { data: mannerData } = useSWR<GetProfilesDetailMannersResponse>(router.query.id ? `/api/profiles/${router.query.id}/manners/preview?prevCursor=0` : null);
  const { data: reviewData } = useSWR<GetProfilesDetailReviewsResponse>(router.query.id ? `/api/profiles/${router.query.id}/reviews/preview?prevCursor=0` : null);

  if (!profileData?.success || !profileData?.profile) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pt-3 pb-5">
      <section>
        {/* 프로필 */}
        <Profiles user={profileData?.profile} uuid={profileData?.profile?.id === -1 ? "" : `#${profileData?.profile?.id}`} />
        {/* 관심사 */}
        {(Boolean(profileData?.profile?.concerns?.length) || user?.id === profileData?.profile?.id) && (
          <div className="mt-3">
            <strong className="block">관심사</strong>
            {Boolean(profileData?.profile?.concerns?.length) ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {ProfileConcerns?.filter((concern) => profileData?.profile?.concerns?.find(({ value }) => concern.value === value))?.map((concern) => (
                  <span key={concern.value} className="inline-block px-2 py-1.5 text-sm border rounded-lg">
                    {concern.emoji} {concern.text}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-gray-500">이웃에게 나를 표현해보세요</p>
            )}
          </div>
        )}
        {/* 수정 */}
        {user?.id === profileData?.profile?.id && (
          <Link href="/user/edit" passHref>
            <Buttons tag="a" size="sm" status="default" className="mt-3">
              프로필 수정
            </Buttons>
          </Link>
        )}
        {/* todo: 매너온도 */}
      </section>
      {/* 정보 */}
      <div className="-mx-5 mt-5 border-t">
        <ul className="divide-y">
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/products/all`}>
              <a className="block py-3.5">
                <div className="relative pl-5 pr-12">
                  <span className="font-semibold">판매 상품 {profileData?.profile?._count?.products ? `${profileData?.profile?._count?.products}개` : ""}</span>
                  <Icons name="ChevronRight" className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/stories/all`}>
              <a className="block py-3.5">
                <div className="relative pl-5 pr-12">
                  <span className="font-semibold">동네생활</span>
                  <Icons name="ChevronRight" className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/manners/all`}>
              <a className="block py-3.5">
                <div className="relative pl-5 pr-12">
                  <span className="font-semibold">받은 매너 평가</span>
                  <Icons name="ChevronRight" className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                {mannerData?.manners && Boolean(mannerData?.manners?.length) && <MannerList list={mannerData?.manners} className="mt-2 px-5" />}
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/reviews/all`}>
              <a className="block py-3.5">
                <div className="relative pl-5 pr-12">
                  <span className="font-semibold">받은 매너 후기</span>
                  <Icons name="ChevronRight" className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
              </a>
            </Link>
            {reviewData?.reviews && Boolean(reviewData?.reviews?.length) && <ReviewList list={reviewData?.reviews} className="px-5" />}
          </li>
        </ul>
      </div>
    </article>
  );
};

const Page: NextPageWithLayout<{
  getProfilesDetail: { options: { url: string; query: string }; response: GetProfilesDetailResponse };
  getProfilesDetailManners: { options: { url: string; query: string }; response: GetProfilesDetailMannersResponse };
  getProfilesDetailReviews: { options: { url: string; query: string }; response: GetProfilesDetailReviewsResponse };
}> = ({ getProfilesDetail, getProfilesDetailManners, getProfilesDetailReviews }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          ...(getProfilesDetail
            ? {
                [`${getProfilesDetail?.options?.url}?${getProfilesDetail?.options?.query}`]: getProfilesDetail.response,
                [`${getProfilesDetailManners?.options?.url}?${getProfilesDetailManners?.options?.query}`]: getProfilesDetailManners.response,
                [`${getProfilesDetailReviews?.options?.url}?${getProfilesDetailReviews?.options?.query}`]: getProfilesDetailReviews.response,
              }
            : {}),
        },
      }}
    >
      <ProfilesDetailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // params
  const profileId = params?.id?.toString() || "";

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
      notFound: true,
    };
  }

  // getProfilesDetailManners
  const profilesDetailManners = profilesDetail?.profile?.id
    ? await getProfilesDetailManners({
        filter: "preview",
        id: profilesDetail?.profile?.id,
        prevCursor: 0,
      })
    : {
        manners: [],
      };

  // getProfilesDetailReviews
  const profilesDetailReviews = profilesDetail?.profile?.id
    ? await getProfilesDetailReviews({
        filter: "preview",
        id: profilesDetail?.profile?.id,
        prevCursor: 0,
      })
    : {
        totalCount: 0,
        reviews: [],
      };

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${profilesDetail?.profile?.name} | 프로필`,
    },
    header: {
      title: `${profilesDetail?.profile?.name}님의 프로필`,
      titleTag: "h1",
      utils: ["back", "title", "home", "share"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getProfilesDetail: {
        options: {
          url: profilesDetail?.profile?.id ? `/api/profiles/${profilesDetail?.profile?.id}` : "",
          query: "",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesDetail || {})),
        },
      },
      getProfilesDetailManners: {
        options: {
          url: profilesDetail?.profile?.id ? `/api/profiles/${profilesDetail?.profile?.id}/manners/preview` : "",
          query: "prevCursor=0",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesDetailManners || {})),
        },
      },
      getProfilesDetailReviews: {
        options: {
          url: profilesDetail?.profile?.id ? `/api/profiles/${profilesDetail?.profile?.id}/reviews/preview` : "",
          query: "prevCursor=0",
        },
        response: {
          success: true,
          ...JSON.parse(JSON.stringify(profilesDetailReviews || {})),
        },
      },
    },
  };
};

export default Page;
