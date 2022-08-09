// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import HometownUpdate, { HometownUpdateProps } from "@components/commons/modals/instance/hometownUpdate";

export interface HometownUpdateModalProps extends HometownUpdateProps {}

export const HometownUpdateModalName = "HometownUpdate";

const HometownUpdateModal = (props: HometownUpdateModalProps & LayerModalProps & ModalComponentProps) => {
  const { openModal, closeModal } = useModal();

  const modalOptions = {
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 설정하기",
    contents: <HometownUpdate />,
  };

  const modalProps = {
    ...modalOptions,
    onOpen: () => openModal(HometownUpdateModal, HometownUpdateModalName, modalOptions),
    onClose: () => closeModal(HometownUpdateModal, HometownUpdateModalName),
  };

  return <LayerModal name={HometownUpdateModalName} {...modalProps} />;
};

export default HometownUpdateModal;
