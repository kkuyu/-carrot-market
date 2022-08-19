import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useUser from "@libs/client/useUser";
import client from "@libs/server/client";
// @api
import { ProfilesConcern } from "@api/profiles/types";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import Profiles from "@components/profiles";
import MannerList from "@components/lists/mannerList";
import ReviewList from "@components/lists/reviewList";
import Buttons from "@components/buttons";

const ProfilesDetailPage: NextPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const { changeLayout } = useLayouts();

  // fetch data: profile detail
  const { data: profileData, error } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);

  // setting layout
  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  if (!profileData?.profile) {
    return <NextError statusCode={404} />;
  }

  return (
    <article className="container pb-5">
      <div className="mt-3">
        <Profiles user={profileData?.profile} uuid={profileData?.profile?.id === -1 ? "" : `#${profileData?.profile?.id}`} />
      </div>

      {/* 관심사 */}
      {(profileData?.profile?.concerns || user?.id === profileData?.profile?.id) && (
        <div className="mt-3">
          <strong className="block">{user?.id === profileData?.profile?.id ? "나의 관심사" : "관심사"}</strong>
          {profileData?.profile?.concerns && (
            <div>
              {ProfilesConcern.filter((concern) => profileData?.profile?.concerns?.includes(concern.value)).map((concern) => (
                <span key={concern.value} className="inline-block mt-2 mr-2 px-2 py-1.5 text-sm border rounded-lg">
                  {concern.emoji} {concern.text}
                </span>
              ))}
            </div>
          )}
          {!profileData?.profile?.concerns && <p className="mt-1 text-gray-500">이웃에게 나를 표현해보세요</p>}
        </div>
      )}

      {/* 프로필 수정 */}
      {user?.id === profileData?.profile?.id && (
        <Link href="/user/edit" passHref>
          <Buttons tag="a" text="프로필 수정" size="sm" status="default" className="mt-3" />
        </Link>
      )}

      {/* todo: 매너온도 */}

      {/* 정보 */}
      <div className="-mx-5 mt-5 border-t">
        <ul className="divide-y">
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/products/all`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">판매상품{profileData?.profile?._count?.products ? ` ${profileData?.profile?._count?.products}개` : ""}</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/stories/story`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">동네생활</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/manners`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">받은 매너 평가</span>
                {profileData && Boolean(profileData?.manners?.length) && (
                  <div className="mt-3 px-5">
                    <MannerList list={profileData?.manners} />
                  </div>
                )}
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/profiles/${profileData?.profile?.id}/reviews/all`}>
              <a className="block py-3">
                <span className="block-arrow font-semibold">받은 매너 후기</span>
              </a>
            </Link>
            {profileData && Boolean(profileData?.reviews?.length) && (
              <div className="px-5">
                <ReviewList list={profileData?.reviews} />
              </div>
            )}
          </li>
        </ul>
      </div>
    </article>
  );
};

const Page: NextPageWithLayout<{
  getProfile: { response: GetProfilesDetailResponse };
}> = ({ getProfile }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
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
  // profileId
  const profileId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!profileId || isNaN(+profileId)) invalidUrl = true;
  // 404
  if (invalidUrl) {
    return {
      notFound: true,
    };
  }

  // getProfile
  const profile = await client.user.findUnique({
    where: {
      id: +profileId,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  let invalidProfile = false;
  if (!profile) invalidProfile = true;
  // 404
  if (invalidProfile) {
    return {
      notFound: true,
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${profile?.name} | 프로필`,
    },
    header: {
      title: `${profile?.name}님의 프로필`,
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
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
    },
  };
};

export default Page;
