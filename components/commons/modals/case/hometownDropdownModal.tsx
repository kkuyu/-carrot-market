// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import HometownDropdown, { HometownDropdownProps } from "@components/commons/modals/instance/hometownDropdown";

export interface HometownDropdownModalProps extends HometownDropdownProps {}

export const HometownDropdownModalName = "HometownDropdown";

const HometownDropdownModal = (props: HometownDropdownModalProps & CustomModalProps & ModalComponentProps) => {
  const { openModal, closeModal } = useModal();

  const modalOptions = {
    hasBackdrop: true,
    contents: <HometownDropdown />,
  };

  const modalProps = {
    ...modalOptions,
    onOpen: () => openModal(HometownDropdownModal, HometownDropdownModalName, modalOptions),
    onClose: () => closeModal(HometownDropdownModal, HometownDropdownModalName),
  };

  return <CustomModal name={HometownDropdownModalName} {...modalProps} />;
};

export default HometownDropdownModal;
