import { useRouter } from "next/router";
// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";

export interface WelcomeAlertModalProps {}

export const WelcomeAlertModalName = "AlertWelcome";

const WelcomeAlertModal = (props: WelcomeAlertModalProps & AlertModalProps & ModalComponentProps) => {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const modalOptions: WelcomeAlertModalProps & AlertModalProps = {
    ...props,
    message: "당근마켓 첫 방문이신가요???",
    actions: [
      {
        key: "cancel",
        style: AlertStyleEnum["cancel"],
        text: "취소",
        handler: null,
      },
      {
        key: "primary",
        style: AlertStyleEnum["primary"],
        text: "당근마켓 시작하기",
        handler: () => router.push("/welcome"),
      },
    ],
  };

  const modalProps: WelcomeAlertModalProps & AlertModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || WelcomeAlertModalName,
    onOpen: () => openModal<WelcomeAlertModalProps>(WelcomeAlertModal, WelcomeAlertModalName, modalOptions),
    onClose: () => closeModal(WelcomeAlertModal, WelcomeAlertModalName),
  };

  return <AlertModal {...modalProps} />;
};

export default WelcomeAlertModal;
