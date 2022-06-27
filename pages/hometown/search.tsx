import { NextPage } from "next";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useUser from "@libs/client/useUser";
import useCoords from "@libs/client/useCoords";
import useSWR from "swr";
import { GetBoundarySearchResponse } from "@api/address/boundary-search";
import { GetWorldGeocodeResponse } from "@api/address/world-geocode";

import Layout from "@components/layout";
import Input from "@components/input";
import Buttons from "@components/buttons";
import AddressList from "@components/addressList";
import useMutation from "@libs/client/useMutation";
import { useRouter } from "next/router";
import { PostHometownResponse } from "@api/users/hometown";

interface SearchForm {
  keyword: string;
}

const HometownSearch: NextPage = () => {
  const router = useRouter();

  const { user } = useUser();
  // todo: 위치 수집 권한이 없는 경우 토스트
  const { state, latitude, longitude } = useCoords();
  const [addressKeyword, setAddressKeyword] = useState("");
  const { register, handleSubmit, formState } = useForm<SearchForm>();

  const { data: boundaryData, error: boundaryError } = useSWR<GetBoundarySearchResponse>(`/api/address/boundary-search?distance=1000&latitude=${latitude}&longitude=${longitude}`);
  const { data: searchData, error: searchError } = useSWR<GetWorldGeocodeResponse>(addressKeyword ? `/api/address/world-geocode?address=${addressKeyword}` : null);

  const [save, { loading: saveLoading, data: saveData }] = useMutation<PostHometownResponse>("/api/users/hometown");

  const onValid = (data: SearchForm) => {
    setAddressKeyword(data.keyword);
  };

  const resetForm = () => {
    setAddressKeyword("");
  };

  const selectItem = ({ ...itemData }) => {
    if (saveLoading) return;
    save(itemData);
  };

  useEffect(() => {
    if (!saveData) return;
    if (!saveData.success && saveData.error?.timestamp) {
      switch (saveData.error.name) {
        default:
          console.error(saveData.error);
          break;
      }
    }
    if (saveData.success) {
      // todo: 법정동과 행정동이 다른 경우 토스트 노출
      console.log("requestAmd", saveData.requestAmd);
      console.log("responseAmd", saveData.responseAmd);
      !user ? router.push("/join") : router.push("/");
    }
  }, [saveData]);

  return (
    <Layout hasBackBtn title="내 동네 설정하기">
      <div className="container">
        {/* search form */}
        <div className="-mx-5 sticky top-[calc(3rem+1px)] left-0 px-5 pt-5 pb-2 bg-white">
          <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
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
            <AddressList isLoading={!boundaryData && !boundaryError} list={boundaryData?.emdongs || []} selectItem={selectItem} resetForm={resetForm} />
          ) : (
            <AddressList isLoading={!searchData && !searchError} list={searchData?.emdongs || []} selectItem={selectItem} resetForm={resetForm} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HometownSearch;
