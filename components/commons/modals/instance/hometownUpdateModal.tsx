import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EmdType } from "@prisma/client";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import { ModalComponentProps } from "@components/commons";
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import AlertModal, { AlertModalProps, AlertStyleEnum } from "@components/commons/modals/case/alertModal";
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import HometownSearchModal, { HometownSearchModalProps, HometownSearchModalName } from "@components/commons/modals/instance/hometownSearchModal";
import EditHometown, { EditHometownTypes } from "@components/forms/editHometown";

export interface HometownUpdateModalProps {}

export const HometownUpdateModalName = "HometownUpdate";

const HometownUpdateModal = (props: HometownUpdateModalProps & LayerModalProps & ModalComponentProps) => {
  const { user, currentAddr, type: userType, mutate: mutateUser } = useUser();
  const { openModal, closeModal } = useModal();

  // mutation data
  const [updateUser, { loading: loadingUser }] = useMutation<PostUserResponse | PostDummyResponse>(userType === "member" ? "/api/user" : "/api/user/dummy", {
    onSuccess: async () => {
      await mutateUser();
    },
  });

  // variable: modal
  const modalOptions: HometownUpdateModalProps & LayerModalProps = {
    ...props,
    headerType: "default" as LayerModalProps["headerType"],
    title: "내 동네 설정하기",
  };
  const modalProps: HometownUpdateModalProps & LayerModalProps & ModalComponentProps = {
    ...modalOptions,
    name: props?.name || HometownUpdateModalName,
    onOpen: () => openModal<HometownUpdateModalProps>(HometownUpdateModal, HometownUpdateModalName, modalOptions),
    onClose: () => closeModal(HometownUpdateModal, HometownUpdateModalName),
  };

  // variable: visible
  const formData = useForm<EditHometownTypes>({
    defaultValues: {
      emdType: user?.emdType,
      mainAddrNm: user?.MAIN_emdAddrNm,
      mainDistance: user?.MAIN_emdPosDx,
      subAddrNm: user?.SUB_emdAddrNm,
      subDistance: user?.SUB_emdPosDx,
    },
  });

  // validate: User
  const validateUser = (data: EditHometownTypes): { isValid: boolean; validData: EditHometownTypes | null } => {
    switch (data.submitType) {
      case "MAIN-update":
        return { isValid: true, validData: { ...data, emdType: EmdType.MAIN } };
      case "SUB-update":
        return { isValid: true, validData: { ...data, emdType: EmdType.SUB } };
      case "MAIN-delete":
        if (data?.subAddrNm && data?.subDistance) {
          openModal<AlertModalProps>(AlertModal, "ConfirmDeleteMainAddress", {
            message: "선택한 지역을 삭제하시겠습니까?",
            actions: [
              {
                key: "cancel",
                style: AlertStyleEnum["cancel"],
                text: "취소",
                handler: null,
              },
              {
                key: "destructive",
                style: AlertStyleEnum["destructive"],
                text: "삭제",
                handler: () => {
                  formData.setValue("submitType", "MAIN-update");
                  formData.setValue("emdType", EmdType.MAIN);
                  formData.setValue("mainAddrNm", user?.SUB_emdAddrNm!);
                  formData.setValue("mainDistance", user?.SUB_emdPosDx!);
                  formData.setValue("subAddrNm", null);
                  formData.setValue("subDistance", null);
                  formData.handleSubmit(submitUser)();
                },
              },
            ],
          });
        } else {
          openModal<AlertModalProps>(AlertModal, "ConfirmLimitedAddress", {
            message: "동네가 1개만 선택된 상태에서는 삭제를 할 수 없어요.\n현재 설정된 동네를 변경하시겠어요?",
            actions: [
              {
                key: "cancel",
                style: AlertStyleEnum["cancel"],
                text: "취소",
                handler: null,
              },
              {
                key: "destructive",
                style: AlertStyleEnum["destructive"],
                text: "변경",
                handler: () => {
                  openModal<HometownSearchModalProps>(HometownSearchModal, HometownSearchModalName, { emdType: EmdType.MAIN });
                },
              },
            ],
          });
        }
        return { isValid: false, validData: null };
      case "SUB-delete":
        openModal<AlertModalProps>(AlertModal, "ConfirmDeleteSubAddress", {
          message: "선택한 지역을 삭제하시겠습니까?",
          actions: [
            {
              key: "cancel",
              style: AlertStyleEnum["cancel"],
              text: "취소",
              handler: null,
            },
            {
              key: "destructive",
              style: AlertStyleEnum["destructive"],
              text: "삭제",
              handler: () => {
                formData.setValue("submitType", "MAIN-update");
                formData.setValue("emdType", EmdType.MAIN);
                formData.setValue("subAddrNm", null);
                formData.setValue("subDistance", null);
                formData.handleSubmit(submitUser)();
              },
            },
          ],
        });
        return { isValid: false, validData: null };
      case "ANOTHER-create":
        if (userType === "member") {
          openModal<HometownSearchModalProps>(HometownSearchModal, HometownSearchModalName, { emdType: EmdType.SUB });
        } else {
          openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {});
        }
        return { isValid: false, validData: null };
      default:
        return { isValid: false, validData: null };
    }
  };

  // update: User
  const submitUser = async (data: EditHometownTypes) => {
    formData.setValue("submitType", "");
    if (loadingUser) return;
    const { isValid, validData } = await validateUser(data);
    if (isValid && validData) updateUser(validData);
  };

  // update: formData
  useEffect(() => {
    if (!user) return;
    formData.setValue("emdType", user?.emdType);
    formData.setValue("mainAddrNm", user?.MAIN_emdAddrNm);
    formData.setValue("mainDistance", user?.MAIN_emdPosDx);
    formData.setValue("subAddrNm", user?.SUB_emdAddrNm);
    formData.setValue("subDistance", user?.SUB_emdPosDx);
  }, [user]);

  return (
    <LayerModal {...modalProps}>
      <section className="container pt-5 pb-5">
        <EditHometown formType="update" formData={formData} onValid={submitUser} isLoading={loadingUser} user={user} currentAddr={currentAddr} />
      </section>
    </LayerModal>
  );
};

export default HometownUpdateModal;
