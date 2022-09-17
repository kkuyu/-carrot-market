import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
// @libs
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostAccountLoginPhoneResponse } from "@api/account/login/phone";
import { PostAccountLoginTokenResponse } from "@api/account/login/token";
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
  const { openToast } = useToast();

  // mutation data
  const [confirmPhone, { loading: loadingPhone, data: phoneData }] = useMutation<PostAccountLoginPhoneResponse>("/api/account/login/phone", {
    onSuccess: async () => {
      formDataByToken.setValue("token", "");
      formDataByToken.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          formDataByPhone.setError("phone", { type: "invalid", message: data.error.message });
          formDataByPhone.setFocus("phone");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });
  const [confirmToken, { loading: loadingToken, data: tokenData }] = useMutation<PostAccountLoginTokenResponse>("/api/account/login/token", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "LoginUser", {
        placement: "bottom",
        message: "로그인 되었어요",
      });
      await mutate("/api/user?");
      router.replace("/");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          formDataByToken.setError("token", { type: "validate", message: data.error.message });
          formDataByToken.setFocus("token");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // variable: visible
  const formDataByPhone = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const formDataByToken = useForm<VerifyTokenTypes>({ mode: "onChange" });

  // confirm: User.phone
  const submitPhone = (data: VerifyPhoneTypes) => {
    if (loadingPhone) return;
    confirmPhone({
      ...data,
    });
  };

  // confirm: User.tokens
  const submitToken = (data: VerifyTokenTypes) => {
    if (loadingToken) return;
    confirmToken({
      ...data,
      phone: phoneData?.phone,
    });
  };

  return (
    <section className="container pt-5 pb-5">
      {/* 헤드라인 */}
      <h1 className="text-2xl font-bold">
        안녕하세요!
        <br />
        휴대폰 번호로 로그인해주세요.
      </h1>
      <p className="mt-2">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

      {/* 휴대폰 번호 */}
      <VerifyPhone formType="confirm" formData={formDataByPhone} onValid={submitPhone} isSuccess={phoneData?.success} isLoading={loadingPhone || loadingToken} className="mt-5" />

      {/* 인증 번호 */}
      {phoneData?.success && <VerifyToken formType="confirm" formData={formDataByToken} onValid={submitToken} isSuccess={tokenData?.success} isLoading={loadingToken} className="mt-4" />}

      {/* 시작하기, 이메일로 계정 찾기 */}
      <div className="empty:hidden mt-5 text-center space-y-1">
        {!phoneData?.success && (
          <p>
            <span className="text-gray-500">첫 방문이신가요?</span>
            <Link href="/welcome/locate" passHref>
              <Buttons tag="a" sort="text-link" status="default" className="font-semibold text-orange-500">
                당근마켓 시작하기
              </Buttons>
            </Link>
          </p>
        )}
        {!phoneData?.success && (
          <p>
            <span className="text-gray-500">전화번호가 변경되었나요?</span>
            <Link href="/verification/email" passHref>
              <Buttons tag="a" sort="text-link" status="default">
                이메일로 계정 찾기
              </Buttons>
            </Link>
          </p>
        )}
      </div>
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
