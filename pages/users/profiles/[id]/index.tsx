import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Error from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import client from "@libs/server/client";
// @api
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
import { ProfilesConcern } from "@api/users/profiles/types";
// @components
import Profiles from "@components/profiles";
import Buttons from "@components/buttons";

const ProfileDetail: NextPage<{
  staticProps: {
    profile: GetProfilesDetailResponse["profile"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  // view model
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.profile?.id ? "public" : "private",
  });

  // static data: profile detail
  const [profile, setProfile] = useState<GetProfilesDetailResponse["profile"] | null>(staticProps?.profile ? staticProps.profile : null);

  // fetch data: profile detail
  const { data, error, mutate: boundMutate } = useSWR<GetProfilesDetailResponse>(router.query.id && profile ? `/api/users/profiles/${router.query.id}` : null);

  // merge data
  useEffect(() => {
    if (!data) return;
    if (!data.success) return;
    setProfile((prev) => ({
      ...prev,
      ...data.profile,
    }));
  }, [data]);

  // setting layout
  useEffect(() => {
    if (!profile) return;

    const mode = !user?.id ? "preview" : user?.id !== profile?.id ? "public" : "private";
    setViewModel({ mode });

    setLayout(() => ({
      title: "프로필",
      seoTitle: `${profile?.name || ""} | 프로필`,
      header: {
        headerUtils: ["back", "home", "share"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id]);

  if (!profile) {
    return <Error statusCode={404} />;
  }

  return (
    <article className="container pb-20">
      <h1>
        <Profiles user={profile} uuid={profile?.id === -1 ? "" : `#${profile?.id}`} />
      </h1>

      {/* 관심사 */}
      {(viewModel.mode === "private" || profile?.concerns) && (
        <div className="mb-4">
          <strong className="block">{viewModel.mode === "private" ? "나의 관심사" : "관심사"}</strong>
          {profile?.concerns && (
            <div>
              {ProfilesConcern.filter((concern) => profile?.concerns?.includes(concern.value)).map((concern) => (
                <span key={concern.value} className="inline-block mt-2 mr-2 px-2 py-1.5 text-sm border rounded-lg">
                  {concern.emoji} {concern.text}
                </span>
              ))}
            </div>
          )}
          {!profile?.concerns && <p className="mt-1 text-gray-500">이웃에게 나를 표현해보세요</p>}
        </div>
      )}

      {/* 프로필 수정 */}
      {viewModel.mode === "private" && (
        <Link href="/users/profiles/edit" passHref>
          <Buttons tag="a" text="프로필 수정" size="sm" status="default" className="mb-4" />
        </Link>
      )}

      {/* todo: 매너온도 */}

      {/* 정보 */}
      <div className="-mx-5 border-t">
        <ul className="divide-y">
          <li>
            <Link href={`/users/profiles/${profile.id}/products`}>
              <a className="relative block py-4 pl-5 pr-10 font-semibold">
                판매상품 {profile?._count?.products ? `${profile._count.products}개` : ""}
                <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </li>
          <li>
            <Link href="">
              <a className="relative block py-4 pl-5 pr-10 font-semibold">
                동네생활
                <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </li>
          <li>
            <Link href="">
              <a className="relative block py-4 pl-5 pr-10 font-semibold">
                받은 매너 평가
                <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </li>
          <li>
            <Link href="">
              <a className="relative block py-4 pl-5 pr-10 font-semibold">
                받은 매너 후기
                <svg className="absolute top-1/2 right-4 -translate-y-1/2 w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </li>
        </ul>
      </div>
    </article>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
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
      notFound: true,
    };
  }

  // initial props
  return {
    props: {
      staticProps: {
        profile: JSON.parse(JSON.stringify(profile || {})),
      },
    },
  };
};

export default ProfileDetail;
