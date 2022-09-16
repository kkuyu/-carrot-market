import { useMemo } from "react";
import { EmdType } from "@prisma/client";
// @libs
import { isInstance } from "@libs/utils";
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import { ModalComponentProps } from "@components/commons";
import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/instance/hometownUpdateModal";
import Buttons from "@components/buttons";

type SwitchHometownTypes = {
  submitType?: string;
  emdType?: EmdType;
};

export interface HometownSwitchModalProps {}

export const HometownSwitchModalName = "HometownSwitch";

const HometownSwitchModal = (props: HometownSwitchModalProps & CustomModalProps & ModalComponentProps) => {
  const { user, type: userType, mutate: mutateUser } = useUser();
  const { openModal, closeModal } = useModal();

  // mutation data
  const [updateUser, { loading: loadingUser }] = useMutation<PostUserResponse | PostDummyResponse>(userType === "member" ? "/api/user" : "/api/user/dummy", {
    onSuccess: async () => {
      await mutateUser();
      closeModal(HometownSwitchModal, HometownSwitchModalName);
    },
  });

  // variable: modal
  const modalOptions: HometownSwitchModalProps & CustomModalProps = {
    ...props,
  };
  const modalProps: HometownSwitchModalProps & CustomModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownSwitchModalName,
    onOpen: () => openModal<HometownSwitchModalProps>(HometownSwitchModal, HometownSwitchModalName, modalOptions),
    onClose: () => closeModal(HometownSwitchModal, HometownSwitchModalName),
  };

  // variable: visible
  const structure = useMemo(() => {
    const location = [
      { key: EmdType.MAIN, text: user?.MAIN_emdPosNm },
      { key: EmdType.SUB, text: Boolean(user?.SUB_emdPosNm) ? user?.SUB_emdPosNm : null },
      { key: "ANOTHER", text: "내 동네 설정하기" },
    ];
    return { location };
  }, [user]);

  // validate: User
  const validateUser = (data: SwitchHometownTypes): { isValid: boolean; validData: SwitchHometownTypes | null } => {
    switch (data.submitType) {
      case "MAIN-switch":
        if (user?.emdType === "MAIN") {
          closeModal(HometownSwitchModal, HometownSwitchModalName);
          return { isValid: false, validData: null };
        }
        return { isValid: true, validData: { ...data, emdType: EmdType.MAIN } };
      case "SUB-switch":
        if (user?.emdType === "SUB") {
          closeModal(HometownSwitchModal, HometownSwitchModalName);
          return { isValid: false, validData: null };
        }
        return { isValid: true, validData: { ...data, emdType: EmdType.SUB } };
      case "ANOTHER-switch":
        openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, {});
        closeModal(HometownSwitchModal, HometownSwitchModalName);
        return { isValid: false, validData: null };
      default:
        return { isValid: false, validData: null };
    }
  };

  // update: User
  const submitUser = async (data: SwitchHometownTypes) => {
    if (loadingUser) return;
    const { isValid, validData } = await validateUser(data);
    if (isValid && validData) updateUser(validData);
  };

  return (
    <CustomModal {...modalProps}>
      <div className="absolute top-12 left-3 flex flex-col py-2 bg-white rounded-md pointer-events-auto" tabIndex={0}>
        {structure?.location
          ?.filter(({ text }) => Boolean(text?.length))
          ?.map(({ key, text }) => (
            <Buttons
              key={key}
              tag="button"
              type="button"
              sort="text-link"
              status="unset"
              onClick={() => submitUser({ submitType: `${key}-switch` })}
              className={`pl-5 pr-5 py-2 ${user?.emdType === key ? "font-semibold" : ""}`}
            >
              <span>{text}</span>
              {isInstance(key, EmdType) ? <span className="sr-only">{user?.emdType === key ? "(선택됨)" : "(선택)"}</span> : <></>}
            </Buttons>
          ))}
      </div>
    </CustomModal>
  );
};

export default HometownSwitchModal;
