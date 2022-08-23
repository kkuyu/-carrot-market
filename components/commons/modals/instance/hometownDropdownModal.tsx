// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserRequestBody, PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import { ModalComponentProps } from "@components/commons";
import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Buttons from "@components/buttons";

export interface HometownDropdownModalProps {}

export const HometownDropdownModalName = "HometownDropdown";

const HometownDropdownModal = (props: HometownDropdownModalProps & CustomModalProps & ModalComponentProps) => {
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/user", {
    onSuccess: () => {
      mutateUser();
      closeModal(HometownDropdownModal, HometownDropdownModalName);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, `UpdatedUser_${data.error.name}`, {
            placement: "bottom",
            message: data.error.message,
          });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostDummyResponse>("/api/user/dummy", {
    onSuccess: () => {
      mutateUser();
      closeModal(HometownDropdownModal, HometownDropdownModalName);
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeoCodeDistrictError":
          openToast<MessageToastProps>(MessageToast, `UpdatedUser_${data.error.name}`, {
            placement: "bottom",
            message: data.error.message,
          });
          break;
        default:
          console.error(data.error);
          break;
      }
    },
  });

  const updateHometown = (updateData: PostUserRequestBody) => {
    if (userType === "member") {
      if (updateUserLoading) return;
      updateUser(updateData);
      return;
    }
    if (updateDummyLoading) return;
    updateDummy(updateData);
  };

  const modalOptions: HometownDropdownModalProps & CustomModalProps = {
    ...props,
  };

  const modalProps: HometownDropdownModalProps & CustomModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownDropdownModalName,
    onOpen: () => openModal<HometownDropdownModalProps>(HometownDropdownModal, HometownDropdownModalName, modalOptions),
    onClose: () => closeModal(HometownDropdownModal, HometownDropdownModalName),
  };

  const addressButtons = [
    {
      key: "MAIN",
      text: user?.MAIN_emdPosNm || "MAIN",
      isActive: user?.emdType === "MAIN",
      selectItem: () => {
        if (user?.emdType === "MAIN") return;
        updateHometown({ emdType: "MAIN" });
      },
    },
    {
      key: "SUB",
      text: user?.SUB_emdPosNm || "SUB",
      isActive: user?.emdType === "SUB",
      selectItem: () => {
        if (user?.emdType === "SUB") return;
        updateHometown({ emdType: "SUB" });
      },
    },
    {
      key: "ANOTHER",
      text: "내 동네 설정하기",
      isActive: false,
      selectItem: () => {
        openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
        closeModal(HometownDropdownModal, HometownDropdownModalName);
      },
    },
  ];

  return (
    <CustomModal {...modalProps}>
      <div className="absolute top-12 left-3 flex flex-col py-2 bg-white rounded-md pointer-events-auto" tabIndex={0}>
        {addressButtons.map(({ key, text, isActive, selectItem }) => (
          <Buttons key={key} tag="button" type="button" sort="text-link" status="unset" onClick={selectItem} className={`pl-5 pr-5 py-2 ${isActive ? "font-semibold" : ""}`}>
            {text}
          </Buttons>
        ))}
      </div>
    </CustomModal>
  );
};

export default HometownDropdownModal;
