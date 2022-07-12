import { NextPage } from "next";
import { useRouter } from "next/router";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSetRecoilState } from "recoil";
// @libs
import { PageLayout } from "@libs/states";
import useQuery from "@libs/client/useQuery";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostVerificationPhoneResponse } from "@api/users/verification-phone";
import { PostConfirmTokenResponse } from "@api/users/confirm-token";
import { PostVerificationUpdateResponse } from "@api/users/verification-update";
// @components
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";

const VerificationPhone: NextPage = () => {
  const router = useRouter();
  const { hasQuery, query } = useQuery();
  const setLayout = useSetRecoilState(PageLayout);

  const { openToast } = useToast();

  // phone
  const verifyPhoneForm = useForm<VerifyPhoneTypes>({ mode: "onChange" });
  const { setError: verifyPhoneError, setFocus: verifyPhoneFocus, setValue: verifyPhoneSetValue, getValues: verifyPhoneGetValue } = verifyPhoneForm;
  const [confirmPhone, { loading: phoneLoading, data: phoneData }] = useMutation<PostVerificationPhoneResponse>("/api/users/verification-phone", {
    onSuccess: () => {
      verifyTokenFocus("token");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "NotFoundUser":
          openToast<MessageToastProps>(MessageToast, "invalid-user", {
            placement: "bottom",
            message: "이메일 주소를 다시 확인해주세요",
          });
          router.replace("/verification-email");
          return;
        case "SameExistingAccount":
        case "AlreadySubscribedAccount":
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
      updateUser({
        originData: { email: verifyPhoneGetValue("targetEmail") },
        updateData: { phone: verifyPhoneGetValue("phone") },
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
  const [updateUser] = useMutation<PostVerificationUpdateResponse>("/api/users/verification-update", {
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
    if (hasQuery && !query) {
      openToast<MessageToastProps>(MessageToast, "invalid-targetEmail", {
        placement: "bottom",
        message: "이메일 주소를 다시 확인해주세요",
      });
      router.replace("/verification-email");
    } else if (!query?.targetEmail || !query.targetEmail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      openToast<MessageToastProps>(MessageToast, "invalid-targetEmail", {
        placement: "bottom",
        message: "이메일 주소를 다시 확인해주세요",
      });
      router.replace("/verification-email");
    } else {
      verifyPhoneSetValue("targetEmail", query.targetEmail);
    }
  }, [hasQuery, query]);

  useEffect(() => {
    setLayout(() => ({
      title: "휴대폰 번호 변경",
      header: {
        headerUtils: ["back", "title"],
      },
      navBar: {
        navBarUtils: [],
      },
    }));
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

export default VerificationPhone;