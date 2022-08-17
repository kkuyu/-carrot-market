import type { HTMLAttributes, ReactElement } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";

export interface SearchKeywordTypes {
  keyword: string;
}

interface SearchKeywordProps extends HTMLAttributes<HTMLFormElement> {
  formData: UseFormReturn<SearchKeywordTypes, object>;
  onValid: (validForm: SearchKeywordTypes) => void;
  placeholder?: string;
  children?: ReactElement;
}

const SearchKeyword = (props: SearchKeywordProps) => {
  const { formData, onValid, placeholder = "", children, className = "", ...restProps } = props;
  const { register, handleSubmit } = formData;

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className={`space-y-3 ${className}`} {...restProps}>
      <div className="space-y-1">
        <Inputs<SearchKeywordTypes["keyword"]>
          register={register("keyword", {
            required: true,
          })}
          name="keyword"
          type="text"
          placeholder={placeholder}
          appendButtons={
            <Buttons
              tag="button"
              type="submit"
              sort="icon-block"
              size="sm"
              status="default"
              text={
                <svg role="img" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              }
              aria-label="검색"
            />
          }
        />
      </div>
      {children}
    </form>
  );
};

export default SearchKeyword;
