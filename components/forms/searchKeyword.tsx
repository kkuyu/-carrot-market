import type { HTMLAttributes, ReactElement } from "react";
import { UseFormReturn } from "react-hook-form";
// @components
import Buttons from "@components/buttons";
import Inputs from "@components/inputs";
import Icons from "@components/icons";

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
            <Buttons tag="button" type="submit" sort="icon-block" size="sm" status="default">
              <Icons name="MagnifyingGlass" className="w-5 h-5" />
            </Buttons>
          }
        />
      </div>
      {children}
    </form>
  );
};

export default SearchKeyword;
