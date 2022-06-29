import { NextPage } from "next";
import { useRouter } from "next/router";

import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useQuery from "@libs/client/useQuery";
import useMutation from "@libs/client/useMutation";
import useCoords from "@libs/client/useCoords";
import { EmdType } from "@prisma/client";
import { GetBoundarySearchResponse } from "@api/address/boundary-search";
import { GetKeywordSearchResponse } from "@api/address/keyword-search";
import { PostUserResponse } from "@api/users/my";
import { PostDummyUserResponse } from "@api/users/dummy-user";

import Layout from "@components/layout";
import Input from "@components/input";
import Buttons from "@components/buttons";
import AddressList, { AddressItem } from "@components/addressList";

interface SearchForm {
  keyword: string;
}

const HometownSearch: NextPage = () => {
  const router = useRouter();
  const { query } = useQuery();

  const { user } = useUser();
  const { latitude, longitude } = useCoords();
  const [addressKeyword, setAddressKeyword] = useState("");
  const { register, handleSubmit, formState, setValue, setFocus } = useForm<SearchForm>();

  const { data: boundaryData, error: boundaryError } = useSWR<GetBoundarySearchResponse>(
    longitude && latitude ? `/api/address/boundary-search?distance=${0.02}&posX=${longitude}&posY=${latitude}` : null
  );
  const { data: keywordData, error: keywordError } = useSWR<GetKeywordSearchResponse>(addressKeyword ? `/api/address/keyword-search?keyword=${addressKeyword}` : null);

  const [userAddrUpdate, { loading: userAddrLoading }] = useMutation<PostUserResponse>("/api/users/my", {
    onSuccess: () => {
      // todo: 저장 토스트
      router.push("/");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [dummyAddrUpdate, { loading: dummyAddrLoading }] = useMutation<PostDummyUserResponse>("/api/users/dummy-user", {
    onSuccess: () => {
      // todo: 저장 토스트
      router.push("/");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const validForm = (data: SearchForm) => {
    setAddressKeyword(data.keyword);
  };

  const resetForm = () => {
    setAddressKeyword("");
    setValue("keyword", "");
    setFocus("keyword");
  };

  const selectItem = (itemData: AddressItem) => {
    if (userAddrLoading || dummyAddrLoading) return;

    if (!user) {
      router.push(`/join?addrNm=${itemData.addrNm}`);
    } else {
      const emdType = query?.emdType && isInstance(query.emdType, EmdType) ? query.emdType : "MAIN";
      if (user.id === -1) dummyAddrUpdate({ ...itemData, emdType, distance: 0.2 });
      if (user.id !== -1) userAddrUpdate({ ...itemData, emdType, distance: 0.2 });
    }
  };

  return (
    <Layout hasBackBtn title="내 동네 설정하기">
      <div className="container">
        {/* search form */}
        <div className="-mx-5 sticky top-[calc(3rem+1px)] left-0 px-5 pt-5 pb-2 bg-white">
          <form onSubmit={handleSubmit(validForm)} noValidate className="space-y-4">
            <div>
              <Input
                register={register("keyword", {})}
                name="keyword"
                type="text"
                kind="text"
                placeholder="동명(읍,면)으로 검색 (ex. 서초동)"
                appendButtons={
                  <Buttons
                    tag="button"
                    type="submit"
                    text="검색"
                    icon={
                      <svg role="img" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    }
                  />
                }
              />
              <span className="empty:hidden invalid">{formState.errors.keyword?.message}</span>
            </div>
            <Buttons tag="button" type="reset" text="현재위치로 찾기" onClick={resetForm} />
          </form>
          <div className="mt-5">
            <strong>{addressKeyword.length === 0 ? "근처 동네" : `'${addressKeyword}' 검색 결과`}</strong>
          </div>
        </div>

        {/* search result */}
        <div className="mt-1 pb-3">
          {!addressKeyword.length ? (
            <AddressList
              isLoading={!boundaryData && !boundaryError}
              list={boundaryData?.emdList || []}
              selectItem={selectItem}
              emptyGuide={
                <div className="py-2 text-center">
                  <p className="text-gray-500">
                    위치 정보를 요청할 수 없어요.
                    <br />
                    내 위치를 확인하도록 허용하거나
                    <br />
                    동네 이름을 검색해 주세요!
                  </p>
                </div>
              }
            />
          ) : (
            <AddressList
              isLoading={!keywordData && !keywordError}
              list={keywordData?.emdList || []}
              selectItem={selectItem}
              emptyGuide={
                <div className="py-2 text-center">
                  <p className="text-gray-500">
                    검색 결과가 없어요.
                    <br />
                    동네 이름을 다시 확인해주세요!
                  </p>
                  <Buttons tag="button" type="button" sort="text-link" size="base" text="동네 이름 다시 검색하기" onClick={resetForm} className="mt-2" />
                </div>
              }
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HometownSearch;
