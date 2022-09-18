import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";
// @libs
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { GetSearchGeoCodeResponse } from "@api/locate/searchGeoCode";
import { PostAccountJoinPhoneResponse } from "@api/account/join/phone";
import { PostAccountJoinTokenResponse } from "@api/account/join/token";
import { PostDummyResponse } from "@api/user/dummy";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import VerifyPhone, { VerifyPhoneTypes } from "@components/forms/verifyPhone";
import VerifyToken, { VerifyTokenTypes } from "@components/forms/verifyToken";
import Buttons from "@components/buttons";

const AccountJoinPage: NextPage = () => {
  const router = useRouter();
  const { openToast } = useToast();

  // fetch data
  const { data: locateData } = useSWR<GetSearchGeoCodeResponse>(router?.query?.locate ? `/api/locate/searchGeoCode?keyword=${router?.query?.locate}` : null, {
    onSuccess: async (data) => {
      if (data.success) return;
      openToast<MessageToastProps>(MessageToast, "InvalidLocation", {
        placement: "bottom",
        message: "먼저 동네를 설정해주세요",
      });
      await router.replace("/welcome/locate");
    },
  });

  // mutation data
  const [confirmPhone, { loading: loadingPhone, data: phoneData }] = useMutation<PostAccountJoinPhoneResponse>("/api/account/join/phone", {
    onSuccess: async () => {
      formDataByToken.setValue("token", "");
      formDataByToken.setFocus("token");
    },
  });
  const [confirmToken, { loading: loadingToken, data: tokenData }] = useMutation<PostAccountJoinTokenResponse>("/api/account/join/token", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "LoginUser", {
        placement: "bottom",
        message: phoneData?.isExisted ? "기존 정보로 로그인 되었어요" : "회원가입이 완료되었어요",
      });
      await mutate("/api/user?");
      await router.replace("/");
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
  const [confirmDummy, { loading: loadingDummy }] = useMutation<PostDummyResponse>("/api/user/dummy", {
    onSuccess: async () => {
      openToast<MessageToastProps>(MessageToast, "LoginUser", {
        placement: "bottom",
        message: "비회원으로 로그인 되었어요",
      });
      await router.replace("/");
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
      mainAddrNm: locateData?.addrNm,
      mainPosX: locateData?.posX,
      mainPosY: locateData?.posY,
      mainDistance: 0.02,
    });
  };

  // confirm: Dummy
  const submitDummy = () => {
    if (loadingDummy) return;
    confirmDummy({
      mainAddrNm: locateData?.addrNm,
      mainPosX: locateData?.posX,
      mainPosY: locateData?.posY,
      mainDistance: 0.02,
    });
  };

  return (
    <section className="container pt-5 pb-5">
      {/* 헤드라인 */}
      <h1 className="text-2xl">
        안녕하세요!
        <br />
        휴대폰 번호로 가입해주세요.
      </h1>
      <p className="mt-2">휴대폰 번호는 안전하게 보관되며 이웃들에게 공개되지 않아요.</p>

      {/* 휴대폰 번호 */}
      <VerifyPhone formType="confirm" formData={formDataByPhone} onValid={submitPhone} isSuccess={phoneData?.success} isLoading={loadingPhone || loadingToken} className="mt-5" />

      {/* 인증 번호 */}
      {phoneData?.success && <VerifyToken formType="confirm" formData={formDataByToken} onValid={submitToken} isSuccess={tokenData?.success} isLoading={loadingToken} className="mt-4" />}

      {/* 둘러보기, 이메일로 로그인하기 */}
      <div className="empty:hidden mt-5 text-center space-y-1">
        {!phoneData?.success && (
          <p>
            <span className="text-gray-500">첫 방문이신가요?</span>
            <Buttons tag="button" type="button" sort="text-link" status="default" onClick={submitDummy}>
              회원가입 없이 둘러보기
            </Buttons>
          </p>
        )}
        {!phoneData?.success && (
          <p>
            <span className="text-gray-500">전화번호가 변경되었나요?</span>
            <Link href="/verification/email" passHref>
              <Buttons tag="a" sort="text-link" status="default">
                이메일로 로그인하기
              </Buttons>
            </Link>
          </p>
        )}
      </div>
    </section>
  );
};

const Page: NextPageWithLayout = () => {
  return <AccountJoinPage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "회원가입",
    },
    header: {
      title: "회원가입",
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
