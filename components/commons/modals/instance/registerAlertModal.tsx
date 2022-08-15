import { useRouter } from "next/router";
// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";

export interface RegisterAlertModalProps {}

export const RegisterAlertModalName = "AlertRegister";

const RegisterAlertModal = (props: RegisterAlertModalProps & AlertModalProps & ModalComponentProps) => {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const modalOptions: RegisterAlertModalProps & AlertModalProps = {
    ...props,
    message: "휴대폰 인증하고\n회원가입하시겠어요?",
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
        text: "회원가입",
        handler: () => router.push("/account/phone"),
      },
    ],
  };

  const modalProps: RegisterAlertModalProps & AlertModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || RegisterAlertModalName,
    onOpen: () => openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, modalOptions),
    onClose: () => closeModal(RegisterAlertModal, RegisterAlertModalName),
  };

  return <AlertModal {...modalProps} />;
};

export default RegisterAlertModal;
