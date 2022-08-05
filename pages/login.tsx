import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostLoginResponse } from "@api/users/login";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";
// @components
import CustomHead from "@components/custom/head";
import Buttons from "@components/buttons";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const Login: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { openToast } = useToast();

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const { setError: verifyPhoneError, setFocus: verifyPhoneFocus, control: verifyPhoneControl } = verifyPhoneForm;
  const [login, { loading: loginLoading, data: loginData }] = useMutation<PostLoginResponse>("/api/users/login", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          verifyPhoneError("phone", { type: "validate", message: data.error.message });
          verifyPhoneFocus("phone");
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
      openToast<MessageToastProps>(MessageToast, "login-user", {
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
      header: {
        title: "로그인",
        titleTag: "strong",
        utils: ["back", "title"],
      },
      navBar: {
        utils: [],
      },
    });
  }, []);

  return (
    <section className="container py-5">
      <CustomHead title="로그인" />

      <h1 className="text-2xl font-bold">
        안녕하세요!
        <br />
        휴대폰 번호로 로그인해주세요.
      </h1>
      <p className="mt-2">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

      {/* 전화번호 입력 */}
      <div className="mt-6">
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

      <div className="empty:hidden mt-6 text-center space-y-1">
        {/* 시작하기 */}
        {verifyPhoneControl.getFieldState("phone").error?.type === "validate" && (
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
              <Buttons tag="a" sort="text-link" status="default" text="이메일로 계정 찾기" className="underline" />
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

export default Login;
