import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { PostVerificationEmailResponse } from "@api/users/verification-email";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";

import Layout from "@components/layouts/layout";
import Buttons from "@components/buttons";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import VerifyEmail, { VerifyEmailTypes } from "@components/forms/verifyEmail";

const VerificationEmail: NextPage = () => {
  const router = useRouter();

  // Email
  const verifyEmailForm = useForm<VerifyEmailTypes>({ mode: "onChange" });
  const { setError: verifyEmailError, setFocus: verifyEmailFocus, getValues: verifyEmailGetValue } = verifyEmailForm;
  const [confirmEmail, { loading: emailLoading, data: emailData }] = useMutation<PostVerificationEmailResponse>("/api/users/verification-email", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          verifyEmailError("email", { type: "validate", message: data.error.message });
          verifyEmailFocus("email");
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
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostConfirmTokenResponse>("/api/users/confirm-token", {
    onSuccess: () => {
      router.push({
        pathname: "/verification-phone",
        query: { targetEmail: verifyEmailGetValue("email") },
      });
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

  return (
    <Layout title="이메일로 계정 찾기" headerUtils={["back", "title"]}>
      <section className="container py-5">
        {/* 이메일 입력 */}
        <VerifyEmail
          formData={verifyEmailForm}
          onValid={(data: VerifyEmailTypes) => {
            if (emailLoading) return;
            confirmEmail(data);
          }}
          isSuccess={tokenData?.success}
          isLoading={tokenLoading}
        />

        <div className="empty:hidden mt-4 text-sm text-center space-y-2">
          {/* 문의하기 */}
          {/* todo: 문의하기(자주 묻는 질문) */}
          {!emailData?.success && (
            <p>
              <span>이메일을 등록한 적이 없으세요?</span>
              <Link href="" passHref>
                <Buttons tag="a" sort="text-link" status="default" text="문의하기" className="underline" />
              </Link>
            </p>
          )}
        </div>

        {/* 인증 결과 확인 */}
        {emailData?.success && (
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

export default VerificationEmail;
