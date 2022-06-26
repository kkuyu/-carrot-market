import { NextPage } from "next";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useCoords from "@libs/client/useCoords";
import useSWR from "swr";
import { GetBoundarySearchResponse } from "@api/address/boundary-search";
import { GetWorldGeocodeResponse } from "@api/address/world-geocode";

import Layout from "@components/layout";
import Input from "@components/input";
import Button from "@components/button";
import AddressList from "@components/addressList";
import useMutation from "@libs/client/useMutation";
import { useRouter } from "next/router";
import { PostHometownResponse } from "@api/users/hometown";

interface SearchForm {
  keyword: string;
}

const HometownSearch: NextPage = () => {
  const router = useRouter();
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
      // console.log(saveData.error);
    }
    if (saveData.success) {
      router.push("/join");
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
                  <button
                    type="submit"
                    className="flex items-center justify-center p-2 text-gray-400 rounded-md outline-none hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                }
              />
              <span className="empty:hidden invalid">{formState.errors.keyword?.message}</span>
            </div>
            <Button type="reset" text="현재위치로 찾기" onClick={resetForm} large={false} />
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
