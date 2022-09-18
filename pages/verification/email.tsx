import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
// @libs
import useMutation from "@libs/client/useMutation";
import useToast from "@libs/client/useToast";
// @api
import { PostVerificationEmailEmailResponse } from "@api/verification/email/email";
import { PostVerificationEmailTokenResponse } from "@api/verification/email/token";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyEmail, { VerifyEmailTypes } from "@components/forms/verifyEmail";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import Buttons from "@components/buttons";

const VerificationEmailPage: NextPage = () => {
  const router = useRouter();
  const { openToast } = useToast();

  // mutation data
  const [confirmEmail, { loading: loadingEmail, data: emailData }] = useMutation<PostVerificationEmailEmailResponse>("/api/verification/email/email", {
    onSuccess: async () => {
      formDataWithToken.setValue("token", "");
      formDataWithToken.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          formDataWithEmail.setError("email", { type: "validate", message: data.error.message });
          formDataWithEmail.setFocus("email");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });
  const [confirmToken, { loading: loadingToken, data: tokenData }] = useMutation<PostVerificationEmailTokenResponse>("/api/verification/email/token", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "LoginUser", {
        placement: "bottom",
        message: "로그인 되었어요",
      });
      await mutate("/api/user?");
      await router.push({ pathname: "/account/phone" });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          formDataWithToken.setError("token", { type: "validate", message: data.error.message });
          formDataWithToken.setFocus("token");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // variable: form
  const formDataWithEmail = useForm<VerifyEmailTypes>({ mode: "onChange" });
  const formDataWithToken = useForm<VerifyTokenTypes>({ mode: "onChange" });

  // confirm: User.email
  const submitEmail = (data: VerifyEmailTypes) => {
    if (loadingEmail) return;
    confirmEmail({
      ...data,
    });
  };

  // confirm: User.tokens
  const submitToken = (data: VerifyTokenTypes) => {
    if (loadingToken) return;
    confirmToken({
      ...data,
      email: emailData?.email,
    });
  };

  return (
    <section className="container pt-5 pb-5">
      {/* 헤드라인 */}
      <h1 className="text-2xl font-bold">
        등록하신 이메일 주소를
        <br />
        입력해주세요
      </h1>

      {/* 이메일 */}
      <VerifyEmail formType="confirm" formData={formDataWithEmail} onValid={submitEmail} isSuccess={tokenData?.success} isLoading={loadingEmail || loadingToken} className="mt-5" />

      {/* 인증 번호 */}
      {emailData?.success && <VerifyToken formType="confirm" formData={formDataWithToken} onValid={submitToken} isSuccess={tokenData?.success} isLoading={loadingToken} className="mt-4" />}

      {/* 문의하기 */}
      {/* todo: 문의하기(자주 묻는 질문) */}
      <div className="empty:hidden mt-5 text-center space-y-1">
        {!emailData?.success && (
          <p>
            <span className="text-gray-500">이메일을 등록한 적이 없으세요?</span>
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" status="default">
                문의하기
              </Buttons>
            </Link>
          </p>
        )}
      </div>
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
