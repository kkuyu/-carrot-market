import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { PostLoginResponse } from "@api/users/login";
import { PostTokenResponse } from "@api/users/token";

import Layout from "@components/layout";
import Input from "@components/input";
import Button from "@components/button";

interface LoginForm {
  phone: string;
}

interface TokenForm {
  token: string;
}

const Login: NextPage = () => {
  const router = useRouter();

  const { register, handleSubmit, formState, setError, setFocus } = useForm<LoginForm>({ mode: "onChange" });
  const { register: tokenRegister, formState: tokenState, handleSubmit: tokenSubmit, setError: tokenError, setFocus: tokenFocus } = useForm<TokenForm>();

  const [login, { loading, data }] = useMutation<PostLoginResponse>("/api/users/login");
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostTokenResponse>("/api/users/token");

  const onValid = (validForm: LoginForm) => {
    if (loading) return;
    login(validForm);
  };

  const onValidToken = (validForm: TokenForm) => {
    if (tokenLoading) return;
    confirmToken(validForm);
  };

  const onClickJoin = () => {
    console.log("onClickJoin");
  };

  useEffect(() => {
    if (!data) return;
    if (!data.success && data.error?.timestamp) {
      switch (data.error.name) {
        case "NotFoundUser":
          setError("phone", { type: "validate", message: data.error.message });
          setFocus("phone");
          break;
        default:
          console.error(data.error);
          break;
      }
    }
    if (data.success) {
      tokenFocus("token");
    }
  }, [data, setError, setFocus, tokenFocus]);

  useEffect(() => {
    if (!tokenData) return;
    if (!tokenData.success && tokenData.error?.timestamp) {
      switch (tokenData.error.name) {
        case "InvalidToken":
          tokenError("token", { type: "validate", message: tokenData.error.message });
          tokenFocus("token");
          break;
        default:
          console.error(tokenData.error);
          break;
      }
    }
    if (tokenData.success) {
      router.replace("/");
    }
  }, [tokenData, tokenError, tokenFocus, router]);

  return (
    <Layout hasHeadBar hasBackBtn>
      <section className="container py-5">
        <h1 className="text-2xl font-bold">
          안녕하세요!
          <br />
          휴대폰 번호로 로그인해주세요.
        </h1>
        <p className="mt-2 text-sm">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

        {/* 전화번호 입력 */}
        <form onSubmit={handleSubmit(onValid)} noValidate className="mt-4 space-y-4">
          <div>
            <Input
              register={register("phone", {
                required: {
                  value: true,
                  message: "휴대폰 번호를 입력해주세요",
                },
                minLength: {
                  value: 8,
                  message: "8자 이상 입력해주세요",
                },
              })}
              name="phone"
              type="number"
              kind="text"
              required={true}
              placeholder="휴대폰 번호(-없이 숫자만 입력)"
            />
            <span className="empty:hidden invalid">{formState.errors.phone?.message}</span>
          </div>
          <Button type="submit" text={!data || !data.success || !loading ? "인증문자 받기" : "인증문자 다시 받기"} disabled={!formState.isValid || loading} theme="white" />
          {formState.errors.phone?.type === "validate" && <Button text="당근마켓 시작하기" onClick={onClickJoin} />}
        </form>

        {/* 이메일로 계정 찾기 */}
        {!data?.success && (
          <>
            <div className="mt-4 text-sm text-center">
              전화번호가 변경되었나요?
              <Link href="/account-verification">
                <a className="ml-1 underline">이메일로 계정 찾기</a>
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
              <Button type="submit" text="인증번호 확인" disabled={tokenLoading} />
            </form>
          </>
        )}
      </section>
    </Layout>
  );
};

export default Login;
