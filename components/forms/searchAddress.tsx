import { UseFormReturn } from "react-hook-form";

import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

export interface SearchAddressTypes {
  keyword: string;
}

interface SearchAddressProps {
  formData: UseFormReturn<SearchAddressTypes, object>;
  onValid: (validForm: SearchAddressTypes) => void;
  onReset: () => void;
  stickyClass?: string;
  keyword: string;
}

const SearchAddress = ({ formData, onValid, onReset, stickyClass = "", keyword }: SearchAddressProps) => {
  const { register, handleSubmit, formState } = formData;

  return (
    <div className={`-mx-5 px-5 pt-5 pb-2 bg-white ${stickyClass ? "sticky " + stickyClass : ""}`}>
      <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">
        <div className="space-y-1">
          <Inputs
            register={register("keyword", {})}
            name="keyword"
            type="text"
            kind="text"
            placeholder="동명(읍,면)으로 검색 (ex. 서초동)"
            appendButtons={
              <Buttons
                tag="button"
                type="submit"
                sort="icon-block"
                size="base"
                status="default"
                text={
                  <svg role="img" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                }
                aria-label="검색"
              />
            }
          />
          <span className="empty:hidden invalid">{formState.errors.keyword?.message}</span>
        </div>
        <Buttons tag="button" type="reset" text="현재위치로 찾기" onClick={onReset} />
      </form>
      <div className="mt-5">
        <strong>{Boolean(keyword.length) ? `'${keyword}' 검색 결과` : `근처 동네`}</strong>
      </div>
    </div>
  );
};

export default SearchAddress;
