// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserRequestBody, PostUserResponse } from "@api/user";
import { PostDummyResponse } from "@api/user/dummy";
// @components
import HometownDropdownModal, { HometownDropdownModalProps, HometownDropdownModalName } from "@components/commons/modals/case/hometownDropdownModal";
import HometownUpdateModal, { HometownUpdateModalProps, HometownUpdateModalName } from "@components/commons/modals/case/hometownUpdateModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";

export interface HometownDropdownProps {}

const HometownDropdown = (props: HometownDropdownProps) => {
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
    <div className="absolute top-12 left-3 py-2 bg-white rounded-md" tabIndex={0}>
      {addressButtons.map(({ key, text, isActive, selectItem }) => {
        return (
          <button key={key} type="button" className={`block w-full px-5 py-2 text-left ${isActive ? "font-semibold text-black" : ""}`} onClick={selectItem}>
            {text}
          </button>
        );
      })}
    </div>
  );
};

export default HometownDropdown;
