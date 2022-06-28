import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import useQuery from "@libs/client/useQuery";
import useMutation from "@libs/client/useMutation";
import { GetAddrRegeocodeResponse } from "@api/address/addr-regeocode";
import { PostJoinResponse } from "@api/users/join";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";

import Layout from "@components/layout";
import Buttons from "@components/buttons";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import { PostDummyUserResponse } from "@api/users/dummy-user";

const Join: NextPage = () => {
  const router = useRouter();
  const { query } = useQuery();

  // check geo code
  const { data: regeocodeData } = useSWR<GetAddrRegeocodeResponse>(query?.posX && query?.posY ? `/api/address/addr-regeocode?posX=${query.posX}&posY=${query.posY}` : null);

  // join
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const [join, { loading: joinLoading, data: joinData }] = useMutation<PostJoinResponse>("/api/users/join", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // token
  const verifyTokenForm = useForm<VerifyTokenTypes>({ mode: "onChange" });
  const { setError: verifyTokenError, setFocus: verifyTokenFocus } = verifyTokenForm;
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostConfirmTokenResponse>("/api/users/confirm-token", {
    onSuccess: () => {
      router.replace("/");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          verifyTokenError("token", { type: "validate", message: data.error.message });
          verifyTokenFocus("token");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // just looking
  const [makeDummy, { loading: dummyLoading }] = useMutation<PostDummyUserResponse>("/api/users/dummy-user", {
    onSuccess: () => {
      console.log("success");
      // router.replace("/");
    },
  });

  useEffect(() => {
    if (!query) return;
    if (!query.posX || !query.posY) {
      // todo: 내 동네 설정 확인 토스트
      router.replace("/hometown/search");
    }
  }, [query]);

  useEffect(() => {
    if (regeocodeData && !regeocodeData.success) {
      // todo: 내 동네 설정 확인 토스트
      router.replace("/hometown/search");
    }
  }, [regeocodeData]);

  return (
    <Layout title="회원가입" hasBackBtn>
      <section className="container py-5">
        <h1 className="text-2xl font-bold">
          안녕하세요!
          <br />
          휴대폰 번호로 가입해주세요.
        </h1>
        <p className="mt-2 text-sm">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

        {/* 전화번호 입력 */}
        <VerifyPhone
          formData={verifyPhoneForm}
          onValid={(data: VerifyPhoneTypes) => {
            if (joinLoading) return;
            join({ ...data, ...regeocodeData?.emdong });
          }}
          isSuccess={joinData?.success}
          isLoading={joinLoading}
        />

        <div className="empty:hidden mt-4 text-sm text-center space-y-2">
          {/* 둘러보기 */}
          {!joinData?.success && (
            <p>
              <span>첫 방문이신가요?</span>
              <Buttons
                tag="button"
                sort="text-link"
                status="default"
                text="회원가입 없이 둘러보기"
                className="underline"
                onClick={() => {
                  if (dummyLoading) return;
                  makeDummy({ ...regeocodeData?.emdong });
                }}
              />
            </p>
          )}
          {/* 이메일로 계정 찾기 */}
          {!joinData?.success && (
            <p>
              <span>전화번호가 변경되었나요?</span>
              <Link href="/verification-email" passHref>
                <Buttons tag="a" sort="text-link" status="default" text="이메일로 계정 찾기" className="underline" />
              </Link>
            </p>
          )}
        </div>

        {/* 인증 결과 확인 */}
        {joinData?.success && (
          <>
            <VerifyToken
              formData={verifyTokenForm}
              onValid={(data: VerifyTokenTypes) => {
                if (tokenLoading) return;
                confirmToken(data);
              }}
              isSuccess={tokenData?.success}
              isLoading={tokenLoading}
            />
          </>
        )}
      </section>
    </Layout>
  );
};

export default Join;
