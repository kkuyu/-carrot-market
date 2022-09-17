import type { GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// @libs
import useCoords from "@libs/client/useCoords";
// @api
import { GetSearchBoundaryResponse } from "@api/locate/searchBoundary";
import { GetSearchKeywordResponse } from "@api/locate/searchKeyword";
// @app
import type { NextPageWithLayout } from "@app";
// @components
import { getLayout } from "@components/layouts/case/siteLayout";
import EditLocateKeyword, { EditLocateKeywordTypes } from "@components/forms/editLocateKeyword";
import LocateList, { LocateItem } from "@components/lists/locateList";

const WelcomeLocatePage: NextPage = () => {
  const router = useRouter();
  const { state, longitude, latitude, mutate: mutateCoords } = useCoords();

  // variable: invisible
  const [locateKeyword, setLocateKeyword] = useState("");

  const { data: locateData, error: locateError } = useSWR<GetSearchKeywordResponse | GetSearchBoundaryResponse>(
    Boolean(locateKeyword.length)
      ? `/api/locate/searchKeyword?keyword=${locateKeyword}`
      : state !== "loading"
      ? `/api/locate/searchBoundary?state=${state}&posX=${longitude}&posY=${latitude}&distance=${0.02}`
      : null
  );

  // variable: visible
  const formData = useForm<EditLocateKeywordTypes>({
    defaultValues: {
      locateKeyword: "",
    },
  });

  // update: locateKeyword
  const submitLocate = (data: EditLocateKeywordTypes) => {
    setLocateKeyword(data.locateKeyword);
  };

  // update: locateKeyword
  const resetLocate = () => {
    mutateCoords();
    setLocateKeyword("");
    formData.setValue("locateKeyword", "");
    formData.setFocus("locateKeyword");
  };

  const selectLocate = (item: LocateItem) => {
    router.push({ pathname: "/account/join", query: { locate: item?.addrNm } });
  };

  return (
    <div className="">
      {/* 검색 폼 */}
      <div className="fixed-container top-12 z-[50]">
        <div className="fixed-inner flex flex-col justify-between h-[9.25rem] px-5 pt-5 bg-white">
          <EditLocateKeyword formType="create" formData={formData} onValid={submitLocate} onReset={resetLocate} />
          <div className="">
            <strong>{`${Boolean(locateKeyword?.length) ? `'${locateKeyword}' 검색 결과` : "근처 동네"}`}</strong>
          </div>
          <span className="absolute top-full left-0 w-full h-2 bg-gradient-to-b from-white" />
        </div>
      </div>

      <div className="container pt-[9.25rem] pb-3">
        {/* 검색 결과: Loading */}
        {/* {!locateData && !locateError && <p className="list-loading">로딩중</p>} */}

        {/* 검색 결과: List */}
        {locateData && <LocateList status={locateData.status} list={locateData.emdList} selectLocate={selectLocate} resetLocate={resetLocate} />}
      </div>
    </div>
  );
};

const Page: NextPageWithLayout = () => {
  return <WelcomeLocatePage />;
};

Page.getLayout = getLayout;

export const getStaticProps: GetStaticProps = async () => {
  // defaultLayout
  const defaultLayout = {
    meta: {
      title: "내 동네 설정하기",
    },
    header: {
      title: "내 동네 설정하기",
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
    },
  };
};

export default Page;
