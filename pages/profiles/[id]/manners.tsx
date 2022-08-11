import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useSWR, { SWRConfig } from "swr";
// @lib
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { GetProfilesDetailResponse } from "@api/profiles/[id]";
import { GetProfilesMannersResponse } from "@api/profiles/[id]/manners";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MannerList from "@components/lists/mannerList";
import Buttons from "@components/buttons";

const ProfilesMannersPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/profiles/${router.query.id}` : null);
  const { data: mannerData } = useSWR<GetProfilesMannersResponse>(router.query.id ? `/api/profiles/${router.query.id}/manners?includeDislike=${profileData?.profile.id === user?.id}` : null);

  const manners = mannerData?.manners.length ? mannerData?.manners : [];
  const goodManners = manners?.filter((manner) => manner.reviews.length > 0 && !manner.reviews.find((review) => review.satisfaction === "dislike"));
  const badManners = manners?.filter((manner) => manner.reviews.length > 1 && manner.reviews.find((review) => review.satisfaction === "dislike"));

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <div className="container pt-5 pb-5">
      <div>
        <h2 className="">받은 매너</h2>
        <div className="mt-2">
          {Boolean(goodManners.length) && <MannerList list={goodManners} />}
          {!Boolean(goodManners.length) && <p>받은 매너 칭찬이 아직 없어요</p>}
        </div>
      </div>

      <div className="mt-5 pt-5 border-t">
        <h2 className="">받은 비매너</h2>
        <div className="mt-2">
          {user?.id !== profileData?.profile.id && <p>받은 비매너는 본인에게만 보여요</p>}
          {user?.id === profileData?.profile.id && Boolean(badManners.length) && <MannerList list={badManners}></MannerList>}
          {user?.id === profileData?.profile.id && !Boolean(badManners.length) && <p>받은 비매너가 없어요</p>}
        </div>
      </div>

      {/* todo: 당근마켓 거래매너 보기 */}
      <div className="mt-5 pt-5 border-t">
        <p className="text-center">
          따뜻한 거래를 위한
          <br />
          당근마켓 거래매너를 확인해보세요
        </p>
        <Buttons tag="button" text="당근마켓 거래매너 보기" className="mt-5" />
      </div>
    </div>
  );
};

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getManners: { query: string; response: GetProfilesMannersResponse };
}> = ({ getUser, getProfile, getManners }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
          [`/api/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [`/api/profiles/${getProfile.response.profile.id}/manners?${getManners.query}`]: getManners.response,
        },
      }}
    >
      <ProfilesMannersPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // profileId
  const profileId: string = params?.id?.toString() || "";

  // invalidUrl
  let invalidUrl = false;
  if (!profileId || isNaN(+profileId)) invalidUrl = true;
  // redirect `/profiles/${profileId}`
  if (invalidUrl) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
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

  // invalidProfile
  let invalidProfile = false;
  if (!profile) invalidProfile = true;
  // redirect `/profiles/${profileId}`
  if (invalidProfile) {
    return {
      redirect: {
        permanent: false,
        destination: `/profiles/${profileId}`,
      },
    };
  }

  // getManners
  const includeDislike = profile?.id === ssrUser?.profile?.id;
  const manners = await client.manner.findMany({
    where: {
      userId: profile?.id,
      ...(!includeDislike
        ? {
            reviews: {
              some: { NOT: [{ satisfaction: "dislike" }] },
            },
          }
        : {}),
    },
    include: {
      reviews: {
        select: {
          id: true,
          satisfaction: true,
        },
      },
    },
  });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `받은 매너 후기 | ${profile?.name} | 프로필`,
    },
    header: {
      title: `${profile?.name}님의 받은 매너 후기`,
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
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getManners: {
        query: `includeDislike=${includeDislike}`,
        response: {
          success: true,
          manners: JSON.parse(JSON.stringify(manners || [])),
          pages: 0,
        },
      },
    },
  };
});

export default Page;
