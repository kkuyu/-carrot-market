import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { PostVerificationEmailResponse } from "@api/users/verification-email";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";

import Layout from "@components/layout";
import Input from "@components/input";
import Button from "@components/button";

interface VerificationForm {
  email: string;
}

interface TokenForm {
  token: string;
}

const VerificationEmail: NextPage = () => {
  const router = useRouter();

  const { register, handleSubmit, formState, setError, setFocus, getValues } = useForm<VerificationForm>({ mode: "onChange" });
  const { register: tokenRegister, formState: tokenState, handleSubmit: tokenSubmit, setError: tokenError, setFocus: tokenFocus } = useForm<TokenForm>();

  const [verification, { loading, data }] = useMutation<PostVerificationEmailResponse>("/api/users/verification-email");
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostConfirmTokenResponse>("/api/users/confirm-token");

  const onValid = (validForm: VerificationForm) => {
    if (loading) return;
    verification(validForm);
  };

  const onValidToken = (validForm: TokenForm) => {
    if (tokenLoading) return;
    confirmToken(validForm);
  };

  useEffect(() => {
    if (!data) return;
    if (!data.success && data.error?.timestamp) {
      switch (data.error.name) {
        case "NotFoundUser":
          setError("email", { type: "validate", message: data.error.message });
          setFocus("email");
          return;
        default:
          console.error(data.error);
          return;
      }
    }
    if (data.success) {
      tokenFocus("token");
    }
  }, [data]);

  useEffect(() => {
    if (!tokenData) return;
    if (!tokenData.success && tokenData.error?.timestamp) {
      switch (tokenData.error.name) {
        case "InvalidToken":
          tokenError("token", { type: "validate", message: tokenData.error.message });
          tokenFocus("token");
          return;
        default:
          console.error(tokenData.error);
          return;
      }
    }
    if (tokenData.success) {
      router.push({
        pathname: "/verification-phone",
        query: { targetEmail: getValues("email") },
      });
    }
  }, [tokenData]);

  return (
    <Layout hasBackBtn title="이메일로 계정 찾기">
      <section className="container py-5">
        {/* 이메일 입력 */}
        <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
          <div>
            <Input
              register={register("email", {
                required: {
                  value: true,
                  message: "이메일 주소를 입력해주세요",
                },
                pattern: {
                  value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
                  message: "이메일 주소를 정확하게 입력해주세요",
                },
              })}
              name="phone"
              type="email"
              kind="text"
              required={true}
              placeholder="이메일 주소"
            />
            <span className="empty:hidden invalid">{formState.errors.email?.message}</span>
          </div>
          <Button type="submit" text={!(data && data.success) ? "인증메일 받기" : loading ? "인증메일 받기" : "인증메일 다시 받기"} disabled={!formState.isValid || loading} theme="white" />
        </form>

        {/* 문의하기 */}
        {!(data && data.success) && (
          <>
            <div className="mt-4 text-sm text-center">
              이메일을 등록한 적이 없으세요?
              {/* todo: 자주 묻는 질문 */}
              <Link href="">
                <a className="ml-1 underline">문의하기</a>
              </Link>
            </div>
          </>
        )}

        {/* 인증 결과 확인 */}
        {data?.success && (
          <>
            <form onSubmit={tokenSubmit(onValidToken)} noValidate className="mt-4 space-y-4">
              <div>
                <Input
                  register={tokenRegister("token", {
                    required: true,
                  })}
                  name="token"
                  type="number"
                  kind="text"
                  required={true}
                  placeholder="인증번호 입력"
                />
                <span className="notice">어떤 경우에도 타인에게 공유하지 마세요!</span>
                <span className="empty:hidden invalid">{tokenState.errors.token?.message}</span>
              </div>
              <Button type="submit" text="이메일로 시작하기" disabled={tokenLoading} />
            </form>
          </>
        )}
      </section>
    </Layout>
  );
};

export default VerificationEmail;
