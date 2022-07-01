import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import useQuery from "@libs/client/useQuery";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { GetGeocodeDistrictResponse } from "@api/address/geocode-district";
import { PostJoinResponse } from "@api/users/join";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";
import { PostJoinDummyResponse } from "@api/users/join-dummy";

import Layout from "@components/layouts/layout";
import Buttons from "@components/buttons";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const Join: NextPage = () => {
  const router = useRouter();
  const { hasQuery, query } = useQuery();

  // toast
  const { openToast } = useToast();

  // check query data
  const { data: addrData } = useSWR<GetGeocodeDistrictResponse>(query?.addrNm ? `api/address/geocode-district?addrNm=${query.addrNm}` : null);

  // join user
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const [joinUser, { loading: userLoading, data: userData }] = useMutation<PostJoinResponse>("/api/users/join", {
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
      openToast<MessageToastProps>(MessageToast, "login-user", {
        placement: "bottom",
        message: "회원가입이 완료되었어요",
      });
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

  // join dummy
  const [joinDummy, { loading: dummyLoading }] = useMutation<PostJoinDummyResponse>("/api/users/join-dummy", {
    onSuccess: () => {
      openToast<MessageToastProps>(MessageToast, "login-dummy", {
        placement: "bottom",
        message: "비회원으로 인증되었어요",
      });
      router.replace("/");
    },
  });

  useEffect(() => {
    if (hasQuery && !query) {
      openToast<MessageToastProps>(MessageToast, "invalid-addrNm", {
        placement: "bottom",
        message: "먼저 내 동네를 설정해주세요",
      });
      router.replace("/welcome/hometown");
    } else if (!query?.addrNm) {
      openToast<MessageToastProps>(MessageToast, "invalid-addrNm", {
        placement: "bottom",
        message: "먼저 내 동네를 설정해주세요",
      });
      router.replace("/welcome/hometown");
    }
  }, [hasQuery, query]);

  useEffect(() => {
    if (addrData && !addrData.success) {
      openToast<MessageToastProps>(MessageToast, "invalid-addrNm", {
        placement: "bottom",
        message: "먼저 내 동네를 설정해주세요",
      });
      router.replace("/welcome/hometown");
    }
  }, [addrData]);

  return (
    <Layout title="회원가입" headerUtils={["back", "title"]}>
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
            if (userLoading) return;
            joinUser({
              ...data,
              emdType: "MAIN",
              mainAddrNm: addrData?.addrNm,
              mainPosX: addrData?.posX,
              mainPosY: addrData?.posY,
              mainDistance: 0.02,
            });
          }}
          isSuccess={userData?.success}
          isLoading={userLoading}
        />

        <div className="empty:hidden mt-4 text-sm text-center space-y-2">
          {/* 둘러보기 */}
          {!userData?.success && (
            <p>
              <span>첫 방문이신가요?</span>
              <Buttons
                tag="button"
                type="button"
                sort="text-link"
                status="default"
                text="회원가입 없이 둘러보기"
                className="underline"
                onClick={() => {
                  if (dummyLoading) return;
                  joinDummy({
                    mainAddrNm: addrData?.addrNm,
                    mainPosX: addrData?.posX,
                    mainPosY: addrData?.posY,
                    mainDistance: 0.02,
                  });
                }}
              />
            </p>
          )}
          {/* 이메일로 계정 찾기 */}
          {!userData?.success && (
            <p>
              <span>전화번호가 변경되었나요?</span>
              <Link href="/verification-email" passHref>
                <Buttons tag="a" sort="text-link" status="default" text="이메일로 계정 찾기" className="underline" />
              </Link>
            </p>
          )}
        </div>

        {/* 인증 결과 확인 */}
        {userData?.success && (
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
