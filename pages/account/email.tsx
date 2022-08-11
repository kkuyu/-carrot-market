import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useLayouts from "@libs/client/useLayouts";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { PostAccountEmailResponse } from "@api/account/email";
import { PostVerificationTokenResponse } from "@api/verification/token";
import { PostVerificationUpdateResponse } from "@api/verification/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import VerifyEmail, { VerifyEmailTypes } from "@components/forms/verifyEmail";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

const AccountEmailPage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { changeLayout } = useLayouts();
  const { openToast } = useToast();

  // copy user
  const originalUser = useRef({ ...user, userType });

  // email
  const verifyEmailForm = useForm<VerifyEmailTypes>({ mode: "onChange" });
  const [confirmEmail, { loading: emailLoading, data: emailData }] = useMutation<PostAccountEmailResponse>("/api/account/email", {
    onSuccess: () => {
      verifyTokenForm.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "SameAccount":
        case "AlreadyRegisteredAccount":
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
      if (updateLoading) return;
      updateUser({
        originData: {
          ...(originalUser.current?.email ? { email: originalUser.current?.email } : {}),
          ...(originalUser.current?.phone ? { phone: originalUser.current?.phone } : {}),
        },
        updateData: { email: verifyEmailForm.getValues("email") },
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

  // update user
  const [updateUser, { loading: updateLoading }] = useMutation<PostVerificationUpdateResponse>("/api/verification/update", {
    onSuccess: async () => {
      await mutateUser();
      openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
        placement: "bottom",
        message: originalUser.current.email ? "이메일이 변경 되었어요" : "이메일이 등록 되었어요",
      });
      router.replace("/account");
    },
    onError: (data) => {
      switch (data?.error?.name) {
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
      <h1 className="text-2xl font-bold">{originalUser.current.userType === "member" ? "새로운" : ""} 이메일 주소를 입력해주세요</h1>
      <p className="mt-2">
        안전한 계정 관리를 위해 이메일을 등록해주세요!
        <br />
        휴대폰 번호 변경 등 계정에 변동사항이 있을 때 사용할 수 있어요.
        <br />
        {originalUser.current.userType === "member" && originalUser.current?.email && <span className="block">현재 등록된 주소는 {originalUser.current.email} 이에요</span>}
      </p>

      {/* 이메일 입력 */}
      <div className="mt-5">
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

      <div className="empty:hidden mt-5 text-center space-y-1">
        {/* 문의하기 */}
        {/* todo: 문의하기(자주 묻는 질문) */}
        {!emailData?.success && (
          <p>
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" status="default" text="이메일 계정에 대해 자세히 알고 싶으신가요?" />
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

const Page: NextPageWithLayout<{
  getUser: { response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          "/api/user": getUser.response,
        },
      }}
    >
      <AccountEmailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // invalidUser
  let invalidUser = false;
  if (!ssrUser.profile) invalidUser = true;
  // redirect `/account`
  if (invalidUser) {
    return {
      redirect: {
        permanent: false,
        destination: `/account`,
      },
    };
  }

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${ssrUser?.profile?.email ? "이메일 변경" : "이메일 등록"} | 계정 관리`,
    },
    header: {
      title: `${ssrUser?.profile?.email ? "이메일 변경" : "이메일 등록"}`,
      titleTag: "h1",
      utils: ["back", "title"],
    },
    navBar: {
      utils: [],
    },
  };

  return {
    props: {
      defaultLayout,
      getUser: {
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
