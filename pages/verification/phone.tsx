import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useLayouts from "@libs/client/useLayouts";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostVerificationPhoneResponse } from "@api/verification/phone";
import { PostVerificationTokenResponse } from "@api/verification/token";
import { PostVerificationUpdateResponse } from "@api/verification/update";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const VerificationPhonePage: NextPage = () => {
  const router = useRouter();
  const { changeLayout } = useLayouts();
  const { openToast } = useToast();

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const [confirmPhone, { loading: phoneLoading, data: phoneData }] = useMutation<PostVerificationPhoneResponse>("/api/verification/phone", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          openToast<MessageToastProps>(MessageToast, "invalid-user", {
            placement: "bottom",
            message: data.error.message,
          });
          router.replace("/verification/email");
          return;
        case "SameAccount":
        case "AlreadySubscribedAccount":
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
  const { setError: verifyTokenError, setFocus: verifyTokenFocus } = verifyTokenForm;
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostVerificationTokenResponse>("/api/verification/token", {
    onSuccess: () => {
      if (updateLoading) return;
      updateUser({
        originData: { email: verifyPhoneForm.getValues("targetEmail") },
        updateData: { phone: verifyPhoneForm.getValues("phone") },
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

  // update user data
  const [updateUser, { loading: updateLoading }] = useMutation<PostVerificationUpdateResponse>("/api/verification/update", {
    onSuccess: () => {
      openToast<MessageToastProps>(MessageToast, "update-user", {
        placement: "bottom",
        message: "휴대폰 번호가 변경되었어요",
      });
      router.push("/login");
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
    const invalidRouter = router.isReady && !router?.query?.targetEmail;
    const invalidEmail = !(router?.query?.targetEmail || "").toString()?.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
    if (invalidRouter || invalidEmail) {
      openToast<MessageToastProps>(MessageToast, "invalid-targetEmail", {
        placement: "bottom",
        message: "이메일 주소를 다시 확인해주세요",
      });
      router.replace("/verification/email");
    } else {
      verifyPhoneForm.setValue("targetEmail", router?.query?.targetEmail?.toString());
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    changeLayout({
      meta: {},
      header: {},
      navBar: {},
    });
  }, []);

  return (
    <section className="container py-5">
      <h1 className="text-2xl font-bold">
        변경된 휴대폰 번호를
        <br />
        입력해주세요
      </h1>
      <p className="mt-2">번호는 안전하게 보관되며 어디에도 공개되지 않아요.</p>

      {/* 전화번호 입력 */}
      <div className="mt-6">
        <VerifyPhone
          formData={verifyPhoneForm}
          onValid={(data: VerifyPhoneTypes) => {
            if (phoneLoading) return;
            confirmPhone(data);
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
          />
        </div>
      )}
    </section>
  );
};

const Page: NextPageWithLayout = () => {
  return <VerificationPhonePage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "휴대폰 번호 변경",
    },
    header: {
      title: "휴대폰 번호 변경",
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
