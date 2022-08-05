import { useRouter } from "next/router";
// @libs
import { HeaderOptions, HeaderUtils } from "@components/layouts";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import usePanel from "@libs/client/usePanel";
// @components
import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import ActionPanel, { ActionPanelProps } from "@components/commons/panels/case/actionPanel";
import HometownDropdown from "@components/commons/modals/hometown/dropdown";
import HometownUpdate from "@components/commons/modals/hometown/update";

export interface HeaderProps extends HeaderOptions {}

const Header = ({ title = "", titleTag = "h1", bgColor = "white", utils, kebabActions, submitId }: HeaderProps) => {
  const router = useRouter();
  const { user, currentAddr } = useUser();

  const { openModal } = useModal();
  const { openPanel } = usePanel();

  const getUtils = (name: HeaderUtils) => {
    switch (name) {
      case "address":
        if (!currentAddr?.emdPosNm) return null;
        return (
          <button
            className="h-12 flex items-center px-5"
            onClick={() => {
              // dummy user
              if (user?.id === -1) {
                openModal<LayerModalProps>(LayerModal, "HometownUpdate", {
                  headerType: "default",
                  title: "내 동네 설정하기",
                  contents: <HometownUpdate />,
                });
                return;
              }
              // membership user
              if (!user?.SUB_emdPosNm) {
                openModal<LayerModalProps>(LayerModal, "HometownUpdate", {
                  headerType: "default",
                  title: "내 동네 설정하기",
                  contents: <HometownUpdate />,
                });
              } else {
                openModal<CustomModalProps>(CustomModal, "HometownDropdown", {
                  hasBackdrop: true,
                  contents: <HometownDropdown />,
                });
              }
            }}
          >
            <span className="pr-1 text-lg font-semibold">{currentAddr?.emdPosNm}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        );
      case "back":
        return (
          <button className="p-3" onClick={() => router.back()}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
        );
      case "home":
        return (
          <button className="p-3" onClick={() => router.push("/")}>
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
        return (
          <button
            className="p-3"
            onClick={() => {
              openPanel<ActionPanelProps>(ActionPanel, name, {
                hasBackdrop: true,
                actions: kebabActions || [],
                cancelBtn: "취소",
              });
            }}
          >
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

  return (
    <div id="layout-header" className={`fixed-container top-0 z-[100] ${bgColor !== "transparent" ? "" : "is-transparent"}`}>
      <header className={`fixed-inner h-12 ${bgColor !== "transparent" ? `bg-${bgColor} border-b text-black` : "bg-gradient-to-b from-black/20  text-white"}`}>
        {/* left utils */}
        <div className="absolute top-1/2 left-0 flex -translate-y-1/2">
          {utils.includes(HeaderUtils["Back"]) && <>{getUtils(HeaderUtils["Back"])}</>}
          {utils.includes(HeaderUtils["Address"]) && <>{getUtils(HeaderUtils["Address"])}</>}
        </div>

        {/* center utils */}
        <div className="flex justify-center items-center w-full h-full px-20">{utils.includes(HeaderUtils["Title"]) && <>{getUtils(HeaderUtils["Title"])}</>}</div>

        {/* right utils */}
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
          {utils.includes(HeaderUtils["Home"]) && <>{getUtils(HeaderUtils["Home"])}</>}
          {utils.includes(HeaderUtils["Share"]) && <>{getUtils(HeaderUtils["Share"])}</>}
          {utils.includes(HeaderUtils["Search"]) && <>{getUtils(HeaderUtils["Search"])}</>}
          {utils.includes(HeaderUtils["Kebab"]) && <>{getUtils(HeaderUtils["Kebab"])}</>}
          {utils.includes(HeaderUtils["Submit"]) && <>{getUtils(HeaderUtils["Submit"])}</>}
        </div>
      </header>
    </div>
  );
};

export default Header;
