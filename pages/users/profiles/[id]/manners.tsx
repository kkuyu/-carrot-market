import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import useSWR, { SWRConfig } from "swr";
// @lib
import { getReviewManners } from "@libs/utils";
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import client from "@libs/server/client";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/users/my";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { GetProfilesMannersResponse } from "@api/users/profiles/[id]/manners";
// @components
import MannerList from "@components/lists/mannerList";
import Buttons from "@components/buttons";

const ProfileManners: NextPage = () => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user } = useUser();
  const { data: profileData } = useSWR<GetProfilesDetailResponse>(router.query.id ? `/api/users/profiles/${router.query.id}` : null);
  const { data: mannerData } = useSWR<GetProfilesMannersResponse>(router.query.id ? `/api/users/profiles/${router.query.id}/manners?includeDislike=true` : null);

  const manners = mannerData?.manners.length ? mannerData?.manners : [];
  const goodManners = manners?.filter((manner) => !manner.reviews.find((review) => review.satisfaction === "dislike"));
  const badManners = manners?.filter((manner) => manner.reviews.find((review) => manner.count > 1 && review.satisfaction === "dislike"));

  useEffect(() => {
    setLayout(() => ({
      title: "매너 상세",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, []);

  return (
    <div className="container pb-5">
      <h1 className="mt-5">받은 매너</h1>
      <div className="mt-2">
        {Boolean(goodManners.length) && <MannerList list={goodManners} />}
        {!Boolean(goodManners.length) && <p>받은 매너 칭찬이 아직 없어요</p>}
      </div>

      <h1 className="mt-5 pt-5 border-t">받은 비매너</h1>
      <div className="mt-2">
        {user?.id !== profileData?.profile.id && <p>받은 비매너는 본인에게만 보여요</p>}
        {user?.id === profileData?.profile.id && Boolean(badManners.length) && user?.id === profileData?.profile.id && <MannerList list={badManners}></MannerList>}
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
  getManners: { response: GetProfilesMannersResponse };
}> = ({ getUser, getProfile, getManners }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/users/my": getUser.response,
          [`/api/users/profiles/${getProfile.response.profile.id}`]: getProfile.response,
          [`/api/users/profiles/${getProfile.response.profile.id}/manners?includeDislike=true`]: getManners.response,
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
  // redirect: /
  if (!profileId || isNaN(+profileId)) {
    return {
      redirect: {
        permanent: false,
        destination: `/`,
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
  // 404
  if (!profile) {
    return {
      redirect: {
        permanent: false,
        destination: `/users/profiles/${profileId}`,
      },
    };
  }

  // find manner
  const manners = await client.manner.findMany({
    orderBy: {
      count: "desc",
    },
    where: {
      userId: profile.id,
    },
    include: {
      reviews: {
        select: {
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
