import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
// @libs
import useUser from "@libs/client/useUser";
import useMutation from "@libs/client/useMutation";
import useModal from "@libs/client/useModal";
// @api
import { PostSearchResponse } from "@api/search";
// @components
import { HeaderOptions, HeaderUtils } from "@components/layouts/header/headerWrapper";
import ActionModal, { ActionModalProps, ActionStyleEnum } from "@components/commons/modals/case/actionModal";
import HometownSwitchModal, { HometownSwitchModalProps, HometownSwitchModalName } from "@components/commons/modals/instance/hometownSwitchModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import EditSearchKeyword, { EditSearchKeywordTypes } from "@components/forms/editSearchKeyword";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface HeaderProps extends HeaderOptions {}

const Header = (props: HeaderProps) => {
  const { title = "", titleTag: TitleTag = "h1", isTransparent = false, utils = [], kebabActions, hamburgerAction, submitId } = props;
  const router = useRouter();
  const { user, currentAddr } = useUser();
  const { openModal } = useModal();

  // mutation data
  const [updateSearch, { loading: loadingSearch }] = useMutation<PostSearchResponse>("/api/search", {
    onSuccess: async (data) => {
      const models = router?.query?.models || "previews";
      const [{ keyword }] = data?.history;
      if (router.pathname === "/search/result/[models]") {
        if (router?.query?.keyword?.toString() === keyword) {
          await mutate("/api/search?");
        } else {
          await router.replace({ pathname: "/search/result/[models]", query: { models, keyword } });
        }
      } else {
        await router.push({ pathname: "/search/result/[models]", query: { models, keyword } });
      }
    },
  });

  // variable: form
  const formDataWithSearch = useForm<EditSearchKeywordTypes>();

  // update: Search
  const submitSearchKeyword = (data: EditSearchKeywordTypes) => {
    if (loadingSearch) return;
    updateSearch({ ...data });
  };

  if (!utils?.length) return null;

  const CustomIconButton = (buttonProps: { pathname?: string; children: ReactElement } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...restButtonProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="icon-block" status="unset" size="lg" onClick={onClick} className={`${buttonClassName}`} {...restButtonProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="icon-block" status="unset" size="lg" className={`${buttonClassName}`} {...restButtonProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  return (
    <div id="layout-header" className={`fixed-container top-0 z-[100] ${isTransparent ? "is-transparent" : ""}`}>
      <header className={`fixed-inner h-12 ${isTransparent ? "bg-gradient-to-b from-black/20  text-white" : "bg-white border-b text-black"}`}>
        {/* Left */}
        <div className="absolute top-1/2 left-0 flex -translate-y-1/2">
          {/* Back */}
          {utils?.includes(HeaderUtils["Back"]) && (
            <CustomIconButton onClick={() => router.back()} aria-label="뒤로가기">
              <Icons name="ChevronLeft" className="w-6 h-6" />
            </CustomIconButton>
          )}
          {/* Address */}
          {utils?.includes(HeaderUtils["Address"]) && currentAddr?.emdPosNm && (
            <button
              className="h-12 flex items-center px-5"
              onClick={() =>
                user?.SUB_emdPosNm
                  ? openModal<HometownSwitchModalProps>(HometownSwitchModal, HometownSwitchModalName, {})
                  : openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {})
              }
            >
              <span className="pr-1 text-lg font-semibold">{currentAddr?.emdPosNm}</span>
              <Icons name="ChevronDown" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <div className="empty:hidden flex justify-center items-center w-full h-full pl-24 pr-24">
          {utils?.includes(HeaderUtils["Title"]) && Boolean(title?.length) && <TitleTag className="text-base font-semibold truncate">{title}</TitleTag>}
        </div>

        {/* Search */}
        <div className="empty:hidden flex justify-center items-center w-full h-full pl-12 pr-5">
          {utils?.includes(HeaderUtils["Search"]) && <EditSearchKeyword formType="create" formData={formDataWithSearch} onValid={submitSearchKeyword} className="w-full" />}
        </div>

        {/* Right */}
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
          {/* Home */}
          {utils?.includes(HeaderUtils["Home"]) && (
            <CustomIconButton pathname="/" aria-label="홈">
              <Icons name="Home" className="w-6 h-6" />
            </CustomIconButton>
          )}
          {/* Share */}
          {utils?.includes(HeaderUtils["Share"]) && (
            <CustomIconButton onClick={() => console.log("share")} aria-label="공유">
              <strong>Share</strong>
            </CustomIconButton>
          )}
          {/* Magnifier */}
          {utils?.includes(HeaderUtils["Magnifier"]) && (
            <CustomIconButton pathname="/search" aria-label="검색">
              <Icons name="MagnifyingGlass" className="w-6 h-6" />
            </CustomIconButton>
          )}
          {/* Hamburger */}
          {utils?.includes(HeaderUtils["Hamburger"]) && (
            <CustomIconButton pathname={hamburgerAction?.pathname} onClick={hamburgerAction?.onClick} aria-label="메뉴">
              <Icons name="Bars3" className="w-6 h-6" />
            </CustomIconButton>
          )}
          {/* Kebab */}
          {utils?.includes(HeaderUtils["Kebab"]) && (
            <CustomIconButton onClick={() => openModal<ActionModalProps>(ActionModal, "HeaderKebab", { actions: kebabActions || [] })} aria-label="옵션 더보기">
              <Icons name="EllipsisVertical" className="w-6 h-6" />
            </CustomIconButton>
          )}
          {/* Submit */}
          {utils?.includes(HeaderUtils["Submit"]) && (
            <Buttons tag="button" type="submit" size="base" sort="text-link" status="primary" form={submitId} className="h-12 pl-5 pr-5 font-semibold">
              완료
            </Buttons>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
