import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { PostVerificationPhoneResponse } from "@api/users/verification-phone";
import { PostTokenResponse } from "@api/users/token";
import { PostUserUpdateResponse } from "@api/users/my/update";

import Layout from "@components/layout";
import Input from "@components/input";
import Button from "@components/button";

interface AccountForm {
  phone: string;
  targetEmail: string;
}

interface TokenForm {
  token: string;
}

const AccountUpdatePhone: NextPage = () => {
  const router = useRouter();
  const [isPassed, setIsPassed] = useState<boolean>(false);

  const { register, handleSubmit, formState, setError, setFocus, setValue, getValues } = useForm<AccountForm>({ mode: "onChange" });
  const { register: tokenRegister, formState: tokenState, handleSubmit: tokenSubmit, setError: tokenError, setFocus: tokenFocus } = useForm<TokenForm>();

  const [account, { loading, data }] = useMutation<PostVerificationPhoneResponse>("/api/users/verification-phone");
  const [confirmToken, { loading: tokenLoading, data: tokenData }] = useMutation<PostTokenResponse>("/api/users/token");
  const [userUpdate, { loading: userLoading, data: userData }] = useMutation<PostUserUpdateResponse>("/api/users/my/update");

  const onValid = (validForm: AccountForm) => {
    if (loading) return;
    account(validForm);
  };

  const onValidToken = (validForm: TokenForm) => {
    if (tokenLoading) return;
    confirmToken(validForm);
  };

  useEffect(() => {
    const targetEmail = decodeURIComponent(router.query.targetEmail?.toString() || "");
    if (!targetEmail || !targetEmail.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      router.replace("/verification-email");
    } else {
      setValue("targetEmail", targetEmail);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    if (!data.success && data.error?.timestamp) {
      switch (data.error.name) {
        case "SameExistingAccount":
        case "AlreadySubscribedAccount":
          setError("phone", { type: "validate", message: data.error.message });
          setFocus("phone");
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
    if (tokenData.success && !isPassed) {
      setIsPassed(() => true);
      userUpdate({
        originData: { email: getValues("targetEmail") },
        updateData: { phone: getValues("phone") },
      });
    }
  }, [tokenData]);

  useEffect(() => {
    if (!isPassed) return;
    if (!userData) return;
    if (!userData.success && userData.error?.timestamp) {
      switch (userData.error.name) {
        default:
          console.error(userData.error);
          return;
      }
    }
    if (userData.success && isPassed) {
      router.push("/");
    }
  }, [userData, isPassed]);

  return (
    <Layout title="휴대폰 번호 변경" hasHeadBar hasBackBtn>
      <section className="container py-5">
        <p className="text-sm">변경된 휴대폰 번호를 입력해주세요. 번호는 안전하게 보관되며 어디에도 공개되지 않아요.</p>

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
          <Button type="submit" text={!(data && data.success) ? "인증문자 받기" : loading ? "인증문자 받기" : "인증문자 다시 받기"} disabled={!formState.isValid || loading} theme="white" />
        </form>

        {/* 인증 결과 확인 */}
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
              disabled={!data?.success}
              placeholder="인증번호 입력"
            />
            <span className="notice">어떤 경우에도 타인에게 공유하지 마세요!</span>
            <span className="empty:hidden invalid">{tokenState.errors.token?.message}</span>
          </div>
          <Button type="submit" text="인증번호 확인" disabled={!data?.success || tokenLoading} />
        </form>
      </section>
    </Layout>
  );
};

export default AccountUpdatePhone;
