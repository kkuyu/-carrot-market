import type { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, PostUserResponse, getUser } from "@api/user";
import { PostAccountEmailEmailResponse } from "@api/account/email/email";
import { PostAccountEmailTokenResponse } from "@api/account/email/token";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import VerifyEmail, { VerifyEmailTypes } from "@components/forms/verifyEmail";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

const AccountEmailPage: NextPage = () => {
  const router = useRouter();
  const { user, mutate: mutateUser } = useUser();
  const { openModal } = useModal();
  const { openToast } = useToast();

  // mutation data
  const [updateUser, { loading: updateLoading }] = useMutation<PostUserResponse>("/api/user", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
        placement: "bottom",
        message: "이메일 주소가 변경되었어요",
      });
      await router.replace("/account");
      await mutateUser();
    },
  });
  const [confirmEmail, { loading: loadingEmail, data: emailData }] = useMutation<PostAccountEmailEmailResponse>("/api/account/email/email", {
    onSuccess: async () => {
      formDataWithToken.setFocus("token");
    },
    onError: async (data) => {
      switch (data?.error?.name) {
        case "SameAccount":
        case "AlreadyRegisteredAccount":
          formDataWithEmail.setError("email", { type: "validate", message: data.error.message });
          formDataWithEmail.setFocus("email");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });
  const [confirmToken, { loading: loadingToken, data: tokenData }] = useMutation<PostAccountEmailTokenResponse>("/api/account/email/token", {
    onSuccess: async () => {
      if (user?.email) {
        openConfirmUserUpdateModal();
      } else {
        openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
          placement: "bottom",
          message: "이메일 주소가 등록되었어요",
        });
        await router.replace("/account");
        await mutateUser();
      }
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

  // modal: ConfirmUserUpdate
  const openConfirmUserUpdateModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmUserUpdate", {
      message: `'${emailData?.email}'로 변경할까요?`,
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: () => {
            formDataWithToken.setValue("token", "");
            confirmToken(null);
            formDataWithEmail.setValue("email", "");
            formDataWithEmail.setFocus("email");
            confirmEmail(null);
          },
        },
        {
          key: "default",
          style: AlertStyleEnum["primary"],
          text: "변경하기",
          handler: () => {
            updateUser({
              email: emailData?.email,
            });
          },
        },
      ],
    });
  };

  return (
    <section className="container pt-5 pb-5">
      {/* 헤드라인 */}
      <h1 className="text-2xl font-bold">{user?.email ? "새로운" : ""} 이메일 주소를 입력해주세요</h1>
      <p className="mt-2">
        <span className="block">안전한 계정 관리를 위해 이메일을 등록해주세요!</span>
        <span className="block">휴대폰 번호 변경 등 계정에 변동사항이 있을 때 사용할 수 있어요.</span>
        {user?.email && <span className="block">현재 등록된 이메일 주소는 &apos;{user.email}&apos;이에요</span>}
      </p>

      {/* 이메일 */}
      <VerifyEmail formType="confirm" formData={formDataWithEmail} onValid={submitEmail} isSuccess={tokenData?.success} isLoading={loadingEmail || loadingToken} className="mt-5" />

      {/* 인증 번호 */}
      {emailData?.success && <VerifyToken formType="confirm" formData={formDataWithToken} onValid={submitToken} isSuccess={tokenData?.success} isLoading={loadingToken} className="mt-4" />}

      {/* 문의하기 */}
      {/* todo: 문의하기(자주 묻는 질문) */}
      <div className="empty:hidden mt-5 text-center space-y-1">
        {!emailData?.success && (
          <p>
            <Link href="" passHref>
              <Buttons tag="a" sort="text-link" status="default">
                이메일 계정에 대해 자세히 알고 싶으신가요?
              </Buttons>
            </Link>
          </p>
        )}
      </div>
    </section>
  );
};

const Page: NextPageWithLayout<{
  getUser: { options: { url: string; query: string }; response: GetUserResponse };
}> = ({ getUser }) => {
  return (
    <SWRConfig
      value={{
        fallback: {
          [`${getUser?.options?.url}?${getUser?.options?.query}`]: getUser.response,
        },
      }}
    >
      <AccountEmailPage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // invalidUser
  // redirect `/account`
  if (!ssrUser.profile) {
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
        options: {
          url: "/api/user",
          query: "",
        },
        response: JSON.parse(JSON.stringify(ssrUser || {})),
      },
    },
  };
});

export default Page;
