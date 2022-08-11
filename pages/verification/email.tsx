import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useMutation from "@libs/client/useMutation";
// @api
import { PostVerificationEmailResponse } from "@api/verification/email";
import { PostVerificationTokenResponse } from "@api/verification/token";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import VerifyEmail, { VerifyEmailTypes } from "@components/forms/verifyEmail";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import Buttons from "@components/buttons";

const VerificationEmailPage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();

  // email
  const verifyEmailForm = useForm<VerifyEmailTypes>({ mode: "onChange" });
  const [confirmEmail, { loading: emailLoading, data: emailData }] = useMutation<PostVerificationEmailResponse>("/api/verification/email", {
    onSuccess: () => {
      verifyTokenForm.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          verifyEmailForm.setError("email", { type: "validate", message: data.error.message });
          verifyEmailForm.setFocus("email");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // token
  const verifyTokenForm = useForm<VerifyTokenTypes>({ mode: "onChange" });
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostVerificationTokenResponse>("/api/verification/token", {
    onSuccess: () => {
      router.push({
        pathname: "/verification/phone",
        query: { targetEmail: verifyEmailForm.getValues("email") },
      });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          verifyTokenForm.setError("token", { type: "validate", message: data.error.message });
          verifyTokenForm.setFocus("token");
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
    <section className="container py-5">
      <h1 className="text-2xl font-bold">
        등록하신 이메일 주소를
        <br />
        입력해주세요
      </h1>

      {/* 이메일 입력 */}
      <div className="mt-6">
        <VerifyEmail
          formData={verifyEmailForm}
          onValid={(data: VerifyEmailTypes) => {
            if (emailLoading) return;
            confirmEmail(data);
          }}
          isSuccess={tokenData?.success}
          isLoading={tokenLoading}
        />
      </div>

      <div className="empty:hidden mt-6 text-center space-y-1">
        {/* 문의하기 */}
        {/* todo: 문의하기(자주 묻는 질문) */}
        {!emailData?.success && (
          <p>
            <span className="text-gray-500">이메일을 등록한 적이 없으세요?</span>
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" status="default" text="문의하기" className="underline" />
            </Link>
          </p>
        )}
      </div>

      {/* 인증 결과 확인 */}
      {emailData?.success && (
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
  return <VerificationEmailPage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "이메일로 계정 찾기",
    },
    header: {
      title: "이메일로 계정 찾기",
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
