import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import NextError from "next/error";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import useSWR from "swr";
// @libs
import { PageLayout } from "@libs/states";
import useUser from "@libs/client/useUser";
import client from "@libs/server/client";
import { getDiffTimeStr } from "@libs/utils";
// @api
import { ProfilesConcern } from "@api/users/profiles/types";
import { GetProfilesDetailResponse } from "@api/users/profiles/[id]";
// @components
import Profiles from "@components/profiles";
import Buttons from "@components/buttons";
import Manner from "@components/cards/manner";

const ProfileDetail: NextPage<{
  staticProps: {
    profile: GetProfilesDetailResponse["profile"];
  };
}> = ({ staticProps }) => {
  const router = useRouter();
  const setLayout = useSetRecoilState(PageLayout);

  const { user, currentAddr } = useUser();

  const [mounted, setMounted] = useState(false);

  // view model
  const [viewModel, setViewModel] = useState({
    mode: !user?.id ? "preview" : user?.id !== staticProps?.profile?.id ? "public" : "private",
  });

  // static data: profile detail
  const [profile, setProfile] = useState<GetProfilesDetailResponse["profile"] | null>(staticProps?.profile ? staticProps.profile : null);

  // fetch data: profile detail
  const { data, error } = useSWR<GetProfilesDetailResponse>(router.query.id && profile ? `/api/users/profiles/${router.query.id}` : null);

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

    setMounted(true);
    setLayout(() => ({
      title: "프로필",
      seoTitle: `${profile?.name || ""} | 프로필`,
      header: {
        headerUtils: ["back", "title", "home", "share"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
  }, [user?.id]);

  if (!profile) {
    return <NextError statusCode={404} />;
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
              <a className="block py-5">
                <span className="block-arrow font-semibold">판매상품{data?.profile?._count?.products ? ` ${data.profile._count.products}개` : ""}</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="">
              <a className="block py-5">
                <span className="block-arrow font-semibold">동네생활</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/users/profiles/${profile.id}/manners`}>
              <a className="block py-5">
                <span className="block-arrow font-semibold">받은 매너 평가</span>
                {Boolean(profile?.manners?.length) && (
                  <ul className="mt-3 space-y-2">
                    {profile.manners.map((item) => (
                      <li key={item.id} className="px-5">
                        <Manner item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </a>
            </Link>
          </li>
          <li>
            <Link href={`/users/profiles/${profile.id}/reviews`}>
              <a className="block py-5">
                <span className="block-arrow font-semibold">받은 매너 후기</span>
              </a>
            </Link>
            {(Boolean(profile?.sellUserReview?.length) || Boolean(profile?.purchaseUserReview?.length)) && (
              <ul className="divide-y">
                {[...profile?.sellUserReview, ...profile?.purchaseUserReview]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((item) => {
                    const signature = item.role === "sellUser" ? "판매자" : item.role === "purchaseUser" ? "구매자" : null;
                    const profile = item.role === "sellUser" ? item.sellUser : item.role === "purchaseUser" ? item.purchaseUser : null;
                    if (!signature || !profile) return null;
                    const today = new Date();
                    const diffTime = getDiffTimeStr(new Date(item?.createdAt).getTime(), today.getTime());
                    if (user?.id?.toString() !== router.query.id) {
                      return (
                        <li key={item?.id} className="relative">
                          <Link href={`/users/profiles/${profile?.id}`}>
                            <a className="block p-5">
                              <Profiles user={profile!} signature={signature} diffTime={mounted ? diffTime : ""} size="sm" />
                              <p className="pt-1 pl-14">{item.text}</p>
                            </a>
                          </Link>
                        </li>
                      );
                    }
                    return (
                      <li key={item?.id} className="relative">
                        <Link href={`/users/profiles/${profile?.id}`}>
                          <a className="block p-5 pb-0">
                            <Profiles user={profile!} signature={signature} diffTime={mounted ? diffTime : ""} size="sm" />
                          </a>
                        </Link>
                        <Link href={`/reviews/${item?.id}`}>
                          <a className="block p-5 pt-1 pl-[4.75rem]">{item.text}</a>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
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
      manners: {
        take: 3,
        orderBy: {
          count: "desc",
        },
        where: {
          reviews: {
            none: {
              satisfaction: "dislike",
            },
          },
        },
        select: {
          id: true,
          value: true,
          count: true,
        },
      },
      sellUserReview: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        where: {
          satisfaction: {
            not: "dislike",
          },
        },
        include: {
          sellUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          purchaseUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      purchaseUserReview: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        where: {
          satisfaction: {
            not: "dislike",
          },
        },
        include: {
          sellUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          purchaseUser: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
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
