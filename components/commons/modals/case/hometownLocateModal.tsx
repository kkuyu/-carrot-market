// @libs
import useModal from "@libs/client/useModal";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import HometownLocate, { HometownLocateProps } from "@components/commons/modals/instance/hometownLocate";

export interface HometownLocateModalProps extends HometownLocateProps {}

export const HometownLocateModalName = "HometownLocate";

const HometownLocateModal = (props: HometownLocateModalProps & LayerModalProps & ModalComponentProps) => {
  const { addrType } = props;
  const { openModal, closeModal } = useModal();

  const modalOptions = {
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 추가하기",
    contents: <HometownLocate addrType={addrType} />,
  };

  const modalProps = {
    ...modalOptions,
    onOpen: () => openModal(HometownLocateModal, HometownLocateModalName, modalOptions),
    onClose: () => closeModal(HometownLocateModal, HometownLocateModalName),
  };

  return <LayerModal name={HometownLocateModalName} {...modalProps} />;
};

export default HometownLocateModal;
