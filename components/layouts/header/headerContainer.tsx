import { useRouter } from "next/router";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
// @components
import { HeaderOptions, HeaderUtils } from "@components/layouts/header/headerWrapper";
import HometownDropdownModal, { HometownDropdownModalProps, HometownDropdownModalName } from "@components/commons/modals/case/hometownDropdownModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/case/hometownUpdateModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";

export interface HeaderProps extends HeaderOptions {}

const Header = (props: HeaderProps) => {
  const { title = "", titleTag = "h1", isTransparent = false, utils = [], kebabActions, submitId } = props;
  const router = useRouter();
  const { user, currentAddr, type: userType } = useUser();
  const { openModal } = useModal();
  const { openPanel } = usePanel();

  const getUtils = (name: HeaderUtils) => {
    if (!utils?.includes(name)) return null;
    switch (name) {
      case "address":
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
      case "back":
        const clickBack = () => router.back();
        return (
          <button className="p-3" onClick={clickBack}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        );
      case "home":
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
      case "kebab":
        const clickKebab = () => {
          openPanel<ActionPanelProps>(ActionPanel, name, {
            hasBackdrop: true,
            actions: kebabActions || [],
            cancelBtn: "취소",
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
      case "share":
        // todo: share
        return <span>share</span>;
      case "search":
        // todo: search
        return <span>search</span>;
      case "submit":
        return (
          <button type="submit" form={submitId} className="h-12 px-5 font-semibold text-base text-orange-500">
            완료
          </button>
        );
      case "title":
        const Tag = titleTag;
        if (!title) return null;
        return <Tag className="text-base font-semibold truncate">{title}</Tag>;
      default:
        return null;
    }
  };

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