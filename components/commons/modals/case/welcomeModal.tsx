import { useRouter } from "next/router";
// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export interface WelcomeModalProps {}

export const WelcomeModalName = "ConfirmWelcome";

const WelcomeModal = (props: WelcomeModalProps & MessageModalProps & ModalComponentProps) => {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const modalOptions = {
    type: "confirm" as MessageModalProps["type"],
    message: "당근마켓 첫 방문이신가요???",
    cancelBtn: "취소",
    confirmBtn: "당근마켓 시작하기",
    hasBackdrop: true,
    onConfirm: () => {
      router.push("/welcome");
    },
  };

  const modalProps = {
    ...modalOptions,
    onOpen: () => openModal(WelcomeModal, WelcomeModalName, modalOptions),
    onClose: () => closeModal(WelcomeModal, WelcomeModalName),
  };

  return <MessageModal name={WelcomeModalName} {...modalProps} />;
};

export default WelcomeModal;
