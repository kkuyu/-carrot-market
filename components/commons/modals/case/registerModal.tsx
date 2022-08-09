import { useRouter } from "next/router";
// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

export interface RegisterModalProps {}

export const RegisterModalName = "ConfirmRegister";

const RegisterModal = (props: RegisterModalProps & MessageModalProps & ModalComponentProps) => {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const modalOptions = {
    type: "confirm" as MessageModalProps["type"],
    message: "휴대폰 인증하고 회원가입하시겠어요?",
    cancelBtn: "취소",
    confirmBtn: "회원가입",
    hasBackdrop: true,
    onConfirm: () => {
      router.push("/account/phone");
    },
  };

  const modalProps = {
    ...modalOptions,
    onOpen: () => openModal(RegisterModal, RegisterModalName, modalOptions),
    onClose: () => closeModal(RegisterModal, RegisterModalName),
  };

  return <MessageModal name={RegisterModalName} {...modalProps} />;
};

export default RegisterModal;
