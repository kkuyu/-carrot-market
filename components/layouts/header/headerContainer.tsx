import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import type { HTMLAttributes } from "react";
import { useForm } from "react-hook-form";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { PostSearchResponse } from "@api/search";
// @components
import { HeaderOptions, HeaderUtils } from "@components/layouts/header/headerWrapper";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import HometownDropdownModal, { HometownDropdownModalProps, HometownDropdownModalName } from "@components/commons/modals/instance/hometownDropdownModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import SearchKeyword, { SearchKeywordTypes } from "@components/forms/searchKeyword";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface HeaderProps extends HeaderOptions {}

const Header = (props: HeaderProps) => {
  const { title = "", titleTag = "h1", isTransparent = false, utils = [], kebabActions, submitId } = props;
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { openModal } = useModal();

  // search
  const searchKeywordForm = useForm<SearchKeywordTypes>();
  const [saveSearch, { loading: saveLoading }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: (data) => {
      const filter = router?.query?.filter || "all";
      const [{ keyword }] = data?.history;
      switch (router.pathname) {
        case "/search":
          router.push({ pathname: "/search/result/[filter]", query: { filter, keyword } });
          break;
        case "/search/result/[filter]":
          if (router?.query?.keyword?.toString() === keyword) return;
          router.replace({ pathname: "/search/result/[filter]", query: { filter, keyword } });
          break;
        default:
          break;
      }
    },
    onError: (data) => {
      switch (data?.error?.name) {
        default:
          console.error(data.error);
          return;
      }
    },
  });

  const HeaderButton = (buttonProps: { pathname?: string } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...restButtonProps } = buttonProps;
    if (!pathname) {
      return <Buttons tag="button" type="button" sort="icon-block" status="unset" size="lg" text={children} onClick={onClick} className={`${buttonClassName}`} {...restButtonProps} />;
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="icon-block" status="unset" size="lg" text={children} onClick={onClick} className={`${buttonClassName}`} {...restButtonProps} />
      </Link>
    );
  };

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
            <Icons name="ChevronDown" className="w-4 h-4" />
          </button>
        );
      case HeaderUtils["Back"]:
        return (
          <HeaderButton onClick={() => router.back()}>
            <Icons name="ChevronLeft" className="w-6 h-6" />
          </HeaderButton>
        );
      case HeaderUtils["Home"]:
        return (
          <HeaderButton pathname="/">
            <Icons name="Home" className="w-6 h-6" />
          </HeaderButton>
        );
      case HeaderUtils["Kebab"]:
        return (
          <HeaderButton onClick={() => openModal<ActionModalProps>(ActionModal, "handleProduct", { actions: kebabActions || [] })}>
            <Icons name="EllipsisVertical" className="w-6 h-6" />
          </HeaderButton>
        );
      case HeaderUtils["Keyword"]:
        if (!currentAddr?.emdPosNm) return null;
        return (
          <SearchKeyword
            formData={searchKeywordForm}
            onValid={(data: SearchKeywordTypes) => {
              if (saveLoading) return;
              saveSearch({ ...data });
            }}
            placeholder={`${currentAddr?.emdPosNm} 근처에서 검색`}
            className="w-full"
          />
        );
      case HeaderUtils["Search"]:
        return (
          <HeaderButton pathname="/search">
            <Icons name="MagnifyingGlass" className="w-6 h-6" />
          </HeaderButton>
        );
      case HeaderUtils["Share"]:
        // todo: share
        return <span>share</span>;
      case HeaderUtils["Submit"]:
        return <Buttons tag="button" type="submit" size="base" sort="text-link" status="primary" form={submitId} className="h-12 pl-5 pr-5 font-semibold" text="완료" />;
      case HeaderUtils["Title"]:
        const Tag = titleTag;
        if (!title) return null;
        return <Tag className="text-base font-semibold truncate">{title}</Tag>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!utils?.includes(HeaderUtils["Keyword"])) return;

    let recentlySearchKeyword = undefined;
    if (router.pathname === "/search") recentlySearchKeyword = "";
    if (router.pathname === "/search/result/[filter]") recentlySearchKeyword = router?.query?.keyword?.toString();

    if (typeof recentlySearchKeyword === "undefined") return;
    if (searchKeywordForm.getValues("keyword") === recentlySearchKeyword) return;
    searchKeywordForm.setValue("keyword", recentlySearchKeyword);
  }, [router.isReady, router.pathname, router.query]);

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
