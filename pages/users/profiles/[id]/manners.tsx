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
import { GetUserResponse } from "@api/users/my";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesMannersResponse } from "@api/users/profiles/[id]/manners";
// @components
import CustomHead from "@components/custom/head";
import MannerList from "@components/lists/mannerList";
import Buttons from "@components/buttons";

const ProfileManners: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/users/profiles/${router.query.id}` : null);
  const { data: mannerData } = useSWR<GetProfilesMannersResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/manners?includeDislike=${profileData?.profile.id === user?.id}` : null);

  const manners = mannerData?.manners.length ? mannerData?.manners : [];
  const goodManners = manners?.filter((manner) => manner.reviews.length > 0 && !manner.reviews.find((review) => review.satisfaction === "dislike"));
  const badManners = manners?.filter((manner) => manner.reviews.length > 1 && manner.reviews.find((review) => review.satisfaction === "dislike"));

  useEffect(() => {
    changeLayout({
      header: {
        title: `${user?.id !== profileData?.profile?.id ? `${profileData?.profile.name}님의 ` : ""}받은 매너 후기`,
        titleTag: "h1",
        utils: ["back", "title"],
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <div className="container pb-5">
      <CustomHead title={`받은 매너 평가 | ${profileData?.profile.name}님의 당근`} />

      <h2 className="mt-5">받은 매너</h2>
      <div className="mt-2">
        {Boolean(goodManners.length) && <MannerList list={goodManners} />}
        {!Boolean(goodManners.length) && <p>받은 매너 칭찬이 아직 없어요</p>}
      </div>

      <h2 className="mt-5 pt-5 border-t">받은 비매너</h2>
      <div className="mt-2">
        {user?.id !== profileData?.profile.id && <p>받은 비매너는 본인에게만 보여요</p>}
        {user?.id === profileData?.profile.id && Boolean(badManners.length) && <MannerList list={badManners}></MannerList>}
        {user?.id === profileData?.profile.id && !Boolean(badManners.length) && <p>받은 비매너가 없어요</p>}
      </div>

      {/* todo: 당근마켓 거래매너 보기 */}
      <div className="mt-5 pt-5 border-t">
        <p className="text-center">
          따뜻한 거래를 위한
          <br />
          당근마켓 거래매너를 확인해보세요
        </p>
        <Buttons text="당근마켓 거래매너 보기" className="mt-5" />
      </div>
    </div>
  );
};

const Page: NextPage<{
  getUser: { response: GetUserResponse };
  getProfile: { response: GetProfilesDetailResponse };
  getManners: { query: string; response: GetProfilesMannersResponse };
}> = ({ getUser, getProfile, getManners }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/users/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [`/api/users/profiles/${getProfile.response.profile.id}/manners?${getManners.query}`]: getManners.response,
        },
      }}
    >
      <ProfileManners />
    </SWRConfig>
  );
};

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // getProfile
  const profileId = params?.id?.toString();

  // invalid params: profileId
  // redirect: /users/profiles/[id]
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles/${profileId}`,
      },
    };
  }

  // find profile
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

  // not found profile
  // redirect: /users/profiles/[id]
  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles/${profileId}`,
      },
    };
  }

  // find manner
  const allowDislike = profile.id === ssrUser?.profile?.id;
  const manners = await client.manner.findMany({
    where: {
      userId: profile.id,
      ...(!allowDislike
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

  return {
    props: {
      getUser: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(ssrUser.profile || {})),
          dummyProfile: JSON.parse(JSON.stringify(ssrUser.dummyProfile || {})),
          currentAddr: JSON.parse(JSON.stringify(ssrUser.currentAddr || {})),
        },
      },
      getProfile: {
        response: {
          success: true,
          profile: JSON.parse(JSON.stringify(profile || {})),
        },
      },
      getManners: {
        query: `includeDislike=${allowDislike}`,
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
