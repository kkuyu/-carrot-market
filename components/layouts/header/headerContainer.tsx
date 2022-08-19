import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
// @api
import { PostSearchResponse } from "@api/search";
// @components
import { HeaderOptions, HeaderUtils } from "@components/layouts/header/headerWrapper";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import HometownDropdownModal, { HometownDropdownModalProps, HometownDropdownModalName } from "@components/commons/modals/instance/hometownDropdownModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import SearchKeyword, { SearchKeywordTypes } from "@components/forms/searchKeyword";

export interface HeaderProps extends HeaderOptions {}

const Header = (props: HeaderProps) => {
  const { title = "", titleTag = "h1", isTransparent = false, utils = [], kebabActions, submitId } = props;
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { openModal } = useModal();

  const searchKeywordForm = useForm<SearchKeywordTypes>();

  const [saveSearch, { loading: saveLoading }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: (data) => {
      const keyword = data?.history?.[0]?.keyword || "";
      router.replace({ pathname: "/search/result/all", query: { keyword } });
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const getUtils = (name: HeaderUtils) => {
    if (!utils?.includes(name)) return null;
    switch (name) {
      case HeaderUtils["Address"]:
        if (!currentAddr?.emdPosNm) return null;
        const clickAddress = () => {
          if (userType === "member" && user?.SUB_emdPosNm) {
            openModal<HometownDropdownModalProps>(HometownDropdownModal, HometownDropdownModalName, {});
            return;
          }
          openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
        };
        return (
          <button className="h-12 flex items-center px-5" onClick={clickAddress}>
            <span className="pr-1 text-lg font-semibold">{currentAddr?.emdPosNm}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        );
      case HeaderUtils["Back"]:
        const clickBack = () => router.back();
        return (
          <button className="p-3" onClick={clickBack}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        );
      case HeaderUtils["Home"]:
        const clickHome = () => router.push("/");
        return (
          <button className="p-3" onClick={clickHome}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
          </button>
        );
      case HeaderUtils["Kebab"]:
        const clickKebab = () => {
          openModal<ActionModalProps>(ActionModal, "handleProduct", {
            actions: kebabActions || [],
          });
        };
        return (
          <button type="button" className="p-3" onClick={clickKebab}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        );
      case HeaderUtils["Keyword"]:
        const validForm = (data: SearchKeywordTypes) => {
          if (saveLoading) return;
          saveSearch({ ...data });
        };
        if (!currentAddr?.emdPosNm) return null;
        return <SearchKeyword formData={searchKeywordForm} onValid={validForm} placeholder={`${currentAddr?.emdPosNm} 근처에서 검색`} className="w-full" />;
      case HeaderUtils["Search"]:
        const clickSearch = () => {
          searchKeywordForm.setValue("keyword", "");
          router.push("/search");
        };
        return (
          <button className="p-3" onClick={clickSearch}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        );
      case HeaderUtils["Share"]:
        // todo: share
        return <span>share</span>;
      case HeaderUtils["Submit"]:
        return (
          <button type="submit" form={submitId} className="h-12 px-5 font-semibold text-base text-orange-500">
            완료
          </button>
        );
      case HeaderUtils["Title"]:
        const Tag = titleTag;
        if (!title) return null;
        return <Tag className="text-base font-semibold truncate">{title}</Tag>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!utils?.includes(HeaderUtils["Keyword"])) return;
    if (!router.isReady) return;
    if (!router.query?.keyword) return;
    const recentlyKeyword = router.query.keyword.toString();
    if (searchKeywordForm.getValues("keyword") !== recentlyKeyword) {
      searchKeywordForm.setValue("keyword", recentlyKeyword);
      saveSearch({ keyword: recentlyKeyword });
    }
  }, [router.isReady, router.query]);

  if (!utils?.length) return null;

  return (
    <div id="layout-header" className={`fixed-container top-0 z-[100] ${isTransparent ? "is-transparent" : ""}`}>
      <header className={`fixed-inner h-12 ${isTransparent ? "bg-gradient-to-b from-black/20  text-white" : "bg-white border-b text-black"}`}>
        {/* left utils */}
        <div className="absolute top-1/2 left-0 flex -translate-y-1/2">
          {getUtils(HeaderUtils["Back"])}
          {getUtils(HeaderUtils["Address"])}
        </div>

        {/* title utils */}
        <div className="empty:hidden flex justify-center items-center w-full h-full pl-24 pr-24">{getUtils(HeaderUtils["Title"])}</div>

        {/* search utils */}
        <div className="empty:hidden flex justify-center items-center w-full h-full pl-12 pr-5">{getUtils(HeaderUtils["Keyword"])}</div>

        {/* right utils */}
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
          {getUtils(HeaderUtils["Home"])}
          {getUtils(HeaderUtils["Share"])}
          {getUtils(HeaderUtils["Search"])}
          {getUtils(HeaderUtils["Kebab"])}
          {getUtils(HeaderUtils["Submit"])}
        </div>
      </header>
    </div>
  );
};

export default Header;
