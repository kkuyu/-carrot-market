import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import useSWR, { SWRConfig } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
// @api
import { GetUserResponse, PostUserResponse, getUser } from "@api/user";
import { PostAccountPhonePhoneResponse } from "@api/account/phone/phone";
import { PostAccountPhoneTokenResponse } from "@api/account/phone/token";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const AccountPhonePage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { openModal } = useModal();
  const { openToast } = useToast();

  // mutation data
  const [updateUser, { loading: updateLoading }] = useMutation<PostUserResponse>("/api/user", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
        placement: "bottom",
        message: "휴대폰 번호가 변경되었어요",
      });
      await router.replace("/account");
      await mutateUser();
    },
  });
  const [confirmPhone, { loading: loadingPhone, data: phoneData }] = useMutation<PostAccountPhonePhoneResponse>("/api/account/phone/phone", {
    onSuccess: async () => {
      tokenFormData.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "SameAccount":
        case "AlreadyRegisteredAccount":
          phoneFormData.setError("phone", { type: "validate", message: data.error.message });
          phoneFormData.setFocus("phone");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });
  const [confirmToken, { loading: loadingToken, data: tokenData }] = useMutation<PostAccountPhoneTokenResponse>("/api/account/phone/token", {
    onSuccess: async () => {
      if (userType === "member") {
        openConfirmUserUpdateModal();
      } else {
        openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
          placement: "bottom",
          message: "휴대폰 번호가 등록되었어요",
        });
        await router.replace("/account");
        await mutateUser();
      }
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "InvalidToken":
          tokenFormData.setError("token", { type: "validate", message: data.error.message });
          tokenFormData.setFocus("token");
          return;
        default:
          console.error(data.error);
          return;
      }
    },
  });

  // variable: visible
  const phoneFormData = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const tokenFormData = useForm<VerifyTokenTypes>({ mode: "onChange" });

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
      name: user?.name,
      emdType: user?.emdType,
      mainAddrNm: user?.MAIN_emdAddrNm,
      mainPosX: user?.MAIN_emdPosX,
      mainPosY: user?.MAIN_emdPosY,
      mainDistance: user?.MAIN_emdPosDx,
    });
  };

  // modal: ConfirmUserUpdate
  const openConfirmUserUpdateModal = () => {
    openModal<AlertModalProps>(AlertModal, "ConfirmUserUpdate", {
      message: `'${phoneData?.phone}'로 변경할까요?`,
      actions: [
        {
          key: "cancel",
          style: AlertStyleEnum["cancel"],
          text: "취소",
          handler: () => {
            tokenFormData.setValue("token", "");
            confirmToken(null);
            phoneFormData.setValue("phone", "");
            phoneFormData.setFocus("phone");
            confirmPhone(null);
          },
        },
        {
          key: "default",
          style: AlertStyleEnum["primary"],
          text: "변경하기",
          handler: () => {
            updateUser({
              phone: phoneData?.phone,
            });
          },
        },
      ],
    });
  };

  return (
    <section className="container pt-5 pb-5">
      {/* 헤드라인 */}
      <h1 className="text-2xl font-bold">{userType === "member" ? "새로운" : ""} 휴대폰 번호를 입력해주세요</h1>
      <p className="mt-2">
        <span className="block">휴대폰 번호는 안전하게 보관되며 어디에도 공개되지 않아요.</span>
        {user?.phone && <span className="block">현재 등록된 번호는 &apos;{user?.phone}&apos;이에요</span>}
      </p>

      {/* 휴대폰 번호 */}
      <VerifyPhone formType="confirm" formData={phoneFormData} onValid={submitPhone} isSuccess={phoneData?.success} isLoading={loadingPhone || loadingToken} className="mt-5" />

      {/* 인증 번호 */}
      {phoneData?.success && <VerifyToken formType="confirm" formData={tokenFormData} onValid={submitToken} isSuccess={tokenData?.success} isLoading={loadingToken} className="mt-4" />}
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
      <AccountPhonePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req }) => {
  // getUser
  const ssrUser = await getUser({ user: req.session.user, dummyUser: req.session.dummyUser });

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `휴대폰 번호 ${ssrUser.profile ? "변경" : "등록"} | 계정 관리`,
    },
    header: {
      title: `휴대폰 번호 ${ssrUser.profile ? "변경" : "등록"}`,
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
