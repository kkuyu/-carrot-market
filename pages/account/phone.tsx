import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
import { withSsrSession } from "@libs/server/withSession";
import getSsrUser from "@libs/server/getUser";
// @api
import { GetUserResponse } from "@api/user";
import { PostAccountPhoneResponse } from "@api/account/phone";
import { PostVerificationTokenResponse } from "@api/verification/token";
import { PostVerificationUpdateResponse } from "@api/verification/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const AccountPhonePage: NextPage = () => {
  const router = useRouter();
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { changeLayout } = useLayouts();
  const { openModal } = useModal();
  const { openToast } = useToast();

  // copy user
  const originalUser = useRef({ ...user, userType });

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const [confirmPhone, { loading: phoneLoading, data: phoneData }] = useMutation<PostAccountPhoneResponse>("/api/account/phone", {
    onSuccess: () => {
      verifyTokenForm.setFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "SameAccount":
        case "AlreadyRegisteredAccount":
          verifyPhoneForm.setError("phone", { type: "validate", message: data.error.message });
          verifyPhoneForm.setFocus("phone");
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
    onSuccess: async () => {
      if (updateLoading) return;
      if (originalUser.current.userType === "member") {
        openConfirmUpdateModal();
        return;
      }
      await mutateUser();
      openToast<MessageToastProps>(MessageToast, "UpdatedUser", {
        placement: "bottom",
        message: "휴대폰 번호가 등록되었어요",
      });
      router.replace("/account");
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
        message: "휴대폰 번호가 변경되었어요",
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

  const openConfirmUpdateModal = () => {
    openModal<MessageModalProps>(MessageModal, "ConfirmUpdate", {
      type: "confirm",
      message: `${verifyPhoneForm.getValues("phone")} 로 변경할까요?`,
      cancelBtn: "취소",
      confirmBtn: "변경하기",
      hasBackdrop: true,
      onCancel: () => {
        verifyTokenForm.setValue("token", "");
        setTimeout(() => {
          (document.querySelector(".container button[type='submit']") as HTMLButtonElement)?.focus();
        }, 0);
      },
      onConfirm: () => {
        updateUser({
          originData: { phone: user?.phone },
          updateData: { phone: verifyPhoneForm.getValues("phone") },
        });
      },
    });
  };

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <section className="container pt-5 pb-5">
      <h1 className="text-2xl font-bold">{originalUser.current.userType === "member" ? "새로운" : ""} 휴대폰 번호를 입력해주세요</h1>
      <p className="mt-2">
        휴대폰 번호는 안전하게 보관되며 어디에도 공개되지 않아요.
        {originalUser.current.userType === "member" && originalUser.current?.phone && <span className="block">현재 등록된 번호는 {originalUser.current.phone} 이에요</span>}
      </p>

      {/* 전화번호 입력 */}
      <div className="mt-5">
        <VerifyPhone
          formData={verifyPhoneForm}
          onValid={(data: VerifyPhoneTypes) => {
            if (phoneLoading) return;
            confirmPhone({
              ...data,
              ...(user && userType !== "member"
                ? {
                    name: user.name,
                    emdType: user.emdType,
                    mainAddrNm: user.MAIN_emdAddrNm,
                    mainPosNm: user.MAIN_emdPosNm,
                    mainPosX: user.MAIN_emdPosX,
                    mainPosY: user.MAIN_emdPosY,
                    mainDistance: user.MAIN_emdPosDx,
                  }
                : {}),
            });
          }}
          isSuccess={phoneData?.success}
          isLoading={phoneLoading}
        />
      </div>

      {/* 인증 결과 확인 */}
      {phoneData?.success && (
        <div className="mt-4">
          <VerifyToken
            formData={verifyTokenForm}
            onValid={(data: VerifyTokenTypes) => {
              if (tokenLoading) return;
              confirmToken(data);
            }}
            isSuccess={tokenData?.success}
            isLoading={tokenLoading}
            submitButtonText={originalUser.current.userType === "member" ? "인증번호 확인" : "인증번호 확인 및 회원가입"}
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
      <AccountPhonePage />
    </SWRConfig>
  );
};

Page.getLayout = getLayout;

export const getServerSideProps = withSsrSession(async ({ req, params }) => {
  // getUser
  const ssrUser = await getSsrUser(req);

  // defaultLayout
  const defaultLayout = {
    meta: {
      title: `${ssrUser.profile ? "휴대폰 번호 변경" : "휴대폰 번호 등록"} | 계정 관리`,
    },
    header: {
      title: `${ssrUser.profile ? "휴대폰 번호 변경" : "휴대폰 번호 등록"}`,
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
