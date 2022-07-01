import { useRouter } from "next/router";

import useMutation from "@libs/client/useMutation";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import { PostUserResponse } from "@api/users/my";
import { PostJoinDummyResponse } from "@api/users/join-dummy";

import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import AddressButton from "@components/layouts/header/utils/addressButton";
import AddressDropdown from "@components/layouts/header/utils/addressDropdown";
import AddressUpdate from "@components/layouts/header/utils/addressUpdate";
import AddressLocate from "@components/layouts/header/utils/addressLocate";

const HeaderUtils = {
  Address: "address",
  Back: "back",
  Home: "home",
  Search: "search",
  Title: "title",
} as const;
type HeaderUtils = typeof HeaderUtils[keyof typeof HeaderUtils];

export interface HeaderProps {
  title?: string;
  headerUtils?: HeaderUtils[];
}

export type ToastControl = (name: "alreadyRegisteredAddress" | "updateUserError" | "updateDummyError", config: { open: boolean }) => void;
export type ModalControl = (
  name: "dropdownModal" | "updateModal" | "locateModal" | "oneOrMore" | "signUpNow",
  config: { open: boolean; originalFocusTarget?: string; addrType?: "MAIN" | "SUB"; beforeClose?: () => void }
) => void;
export type UpdateHometown = (updateData: { emdType?: "MAIN" | "SUB"; mainAddrNm?: string; mainDistance?: number; subAddrNm?: string | null; subDistance?: number | null }) => void;

const Header = ({ title, headerUtils = [] }: HeaderProps) => {
  const router = useRouter();
  const { user, mutate: mutateUser } = useUser();

  const { openModal, closeModal } = useModal();
  const { openToast, closeToast } = useToast();

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/users/my", {
    onSuccess: () => {
      console.log("updateUser success");
      mutateUser();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeocodeDistrictError":
          toastControl("updateUserError", { open: true });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostJoinDummyResponse>("/api/users/join-dummy", {
    onSuccess: () => {
      console.log("updateDummy success");
      mutateUser();
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeocodeDistrictError":
          toastControl("updateDummyError", { open: true });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const updateHometown: UpdateHometown = (updateData) => {
    // dummy user
    if (user?.id === -1) {
      if (updateDummyLoading) return;
      updateDummy(updateData);
      return;
    }
    // membership user
    if (updateUserLoading) return;
    updateUser(updateData);
  };

  const toastControl: ToastControl = (name, config) => {
    switch (name) {
      case "alreadyRegisteredAddress":
        if (!config.open) {
          closeToast(MessageToast, name);
          break;
        }
        openToast<MessageToastProps>(MessageToast, name, {
          placement: "bottom",
          message: "이미 등록된 주소예요",
        });
        break;
      case "updateUserError":
      case "updateDummyError":
        if (!config.open) {
          closeToast(MessageToast, name);
          break;
        }
        openToast<MessageToastProps>(MessageToast, name, {
          placement: "bottom",
          message: "서버와 통신이 원활하지않습니다. 잠시후 다시 시도해주세요.",
        });
        break;
      default:
        console.error("toastControl", name);
        break;
    }
  };

  const modalControl: ModalControl = (name, config) => {
    switch (name) {
      case "dropdownModal":
        if (!config.open) {
          if (config?.beforeClose) config.beforeClose();
          closeModal(CustomModal, name);
          break;
        }
        openModal<CustomModalProps>(CustomModal, name, {
          hasBackdrop: true,
          ...(config.originalFocusTarget ? { originalFocusTarget: config.originalFocusTarget } : {}),
          contents: <AddressDropdown toastControl={toastControl} modalControl={modalControl} updateHometown={updateHometown} />,
        });
        break;
      case "updateModal":
        if (!config.open) {
          if (config?.beforeClose) config.beforeClose();
          closeModal(LayerModal, name);
          break;
        }
        openModal<LayerModalProps>(LayerModal, name, {
          headerType: "default",
          title: "내 동네 설정하기",
          ...(config.originalFocusTarget ? { originalFocusTarget: config.originalFocusTarget } : {}),
          contents: <AddressUpdate toastControl={toastControl} modalControl={modalControl} updateHometown={updateHometown} />,
        });
        break;
      case "locateModal":
        if (!config.open) {
          if (config?.beforeClose) config.beforeClose();
          closeModal(LayerModal, name);
          break;
        }
        openModal<LayerModalProps>(LayerModal, name, {
          headerType: "default",
          title: "내 동네 추가하기",
          ...(config.originalFocusTarget ? { originalFocusTarget: config.originalFocusTarget } : {}),
          contents: <AddressLocate toastControl={toastControl} modalControl={modalControl} updateHometown={updateHometown} addrType={config?.addrType || "SUB"} />,
        });
        break;
      case "oneOrMore":
        if (!config.open) {
          closeModal(MessageModal, name);
          break;
        }
        openModal<MessageModalProps>(MessageModal, name, {
          type: "confirm",
          message: "동네가 1개만 선택된 상태에서는 삭제를 할 수 없어요. 현재 설정된 동네를 변경하시겠어요?",
          cancelBtn: "취소",
          confirmBtn: "변경",
          hasBackdrop: true,
          onConfirm: () => {
            modalControl("locateModal", { open: true, addrType: "MAIN" });
            modalControl("updateModal", { open: false });
          },
        });
        break;
      case "signUpNow":
        if (!config.open) {
          closeModal(MessageModal, name);
          break;
        }
        openModal<MessageModalProps>(MessageModal, name, {
          type: "confirm",
          message: "동네를 추가하시려면 회원가입이 필요해요. 휴대폰 인증하고 회원가입하시겠어요?",
          cancelBtn: "취소",
          confirmBtn: "회원가입",
          hasBackdrop: true,
          onConfirm: () => {
            // todo: 회원가입
            console.log("onConfirm");
          },
        });
        break;
      default:
        console.error("modalControl", name);
        break;
    }
  };

  const getUtils = (name: HeaderUtils) => {
    switch (name) {
      case "address":
        return <AddressButton toastControl={toastControl} modalControl={modalControl} updateHometown={updateHometown} />;
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
      case "search":
        // todo: search
        return <span>search</span>;
      case "title":
        return <strong className="text-base font-semibold font-semibold truncate">{`${title ? title : "title"}`}</strong>;
      default:
        return null;
    }
  };

  if (!headerUtils.length) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 w-full z-100">
      <div className="mx-auto w-full max-w-xl bg-white border-b">
        <div className="relative">
          {/* left utils */}
          <div className="absolute top-1/2 left-0 flex -translate-y-1/2">
            {headerUtils.includes(HeaderUtils["Back"]) && <>{getUtils(HeaderUtils["Back"])}</>}
            {headerUtils.includes(HeaderUtils["Address"]) && <>{getUtils(HeaderUtils["Address"])}</>}
          </div>

          {/* center utils */}
          <div className="flex justify-center items-center w-full h-12 px-20">{headerUtils.includes(HeaderUtils["Title"]) && <>{getUtils(HeaderUtils["Title"])}</>}</div>

          {/* right utils */}
          <div className="absolute top-1/2 right-0 flex -translate-y-1/2">
            {headerUtils.includes(HeaderUtils["Home"]) && <>{getUtils(HeaderUtils["Home"])}</>}
            {headerUtils.includes(HeaderUtils["Search"]) && <>{getUtils(HeaderUtils["Search"])}</>}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
