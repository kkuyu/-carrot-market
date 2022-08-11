import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostAccountLoginResponse } from "@api/account/login";
import { PostVerificationTokenResponse } from "@api/verification/token";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import Buttons from "@components/buttons";

const AccountLoginPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { openToast } = useToast();

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const [login, { loading: loginLoading, data: loginData }] = useMutation<PostAccountLoginResponse>("/api/account/login", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          verifyPhoneForm.setError("phone", { type: "validate", message: data.error.message });
          verifyPhoneForm.setFocus("phone");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // token
  const verifyTokenForm = useForm<VerifyTokenTypes>({ mode: "onChange" });
  const { setError: verifyTokenError, setFocus: verifyTokenFocus } = verifyTokenForm;
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostVerificationTokenResponse>("/api/verification/token", {
    onSuccess: () => {
      openToast<MessageToastProps>(MessageToast, "LoginUser", {
        placement: "bottom",
        message: "로그인 되었어요",
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

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <section className="container pt-5 pb-5">
      <h1 className="text-2xl font-bold">
        안녕하세요!
        <br />
        휴대폰 번호로 로그인해주세요.
      </h1>
      <p className="mt-2">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

      {/* 전화번호 입력 */}
      <div className="mt-5">
        <VerifyPhone
          formData={verifyPhoneForm}
          onValid={(data: VerifyPhoneTypes) => {
            if (loginLoading) return;
            login(data);
          }}
          isSuccess={loginData?.success}
          isLoading={loginLoading}
        />
      </div>

      <div className="empty:hidden mt-5 text-center space-y-1">
        {/* 시작하기 */}
        {verifyPhoneForm.control.getFieldState("phone").error?.type === "validate" && (
          <p>
            <span className="text-gray-500">첫 방문이신가요?</span>
            <Link href="/welcome/locate" passHref>
              <Buttons tag="a" sort="text-link" status="primary" text="당근마켓 시작하기" />
            </Link>
          </p>
        )}
        {/* 이메일로 계정 찾기 */}
        {!loginData?.success && (
          <p>
            <span className="text-gray-500">전화번호가 변경되었나요?</span>
            <Link href="/verification/email" passHref>
              <Buttons tag="a" sort="text-link" status="default" text="이메일로 계정 찾기" />
            </Link>
          </p>
        )}
      </div>

      {/* 인증 결과 확인 */}
      {loginData?.success && (
        <div className="mt-4">
          <VerifyToken
            formData={verifyTokenForm}
            onValid={(data: VerifyTokenTypes) => {
              if (tokenLoading) return;
              confirmToken(data);
            }}
            isSuccess={tokenData?.success}
            isLoading={tokenLoading}
          />
        </div>
      )}
    </section>
  );
};

const Page: NextPageWithLayout = () => {
  return <AccountLoginPage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "로그인",
    },
    header: {
      title: "로그인",
      titleTag: "strong",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
    },
  };
};

export default Page;
