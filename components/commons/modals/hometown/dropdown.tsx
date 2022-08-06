// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
import useToast from "@libs/client/useToast";
import useMutation from "@libs/client/useMutation";
// @api
import { PostUserRequestBody, PostUserResponse } from "@api/users";
import { PostDummyResponse } from "@api/users/dummy";
// @components
import LayerModal, { LayerModalProps } from "@components/commons/modals/case/layerModal";
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import CustomModal, { CustomModalProps } from "@components/commons/modals/case/customModal";
import HometownUpdate from "@components/commons/modals/hometown/update";

interface HometownDropdownProps {}

const HometownDropdown = ({}: HometownDropdownProps) => {
  const { user, currentAddr, mutate: mutateUser } = useUser();

  const { openModal, closeModal } = useModal();
  const { openToast } = useToast();

  const [updateUser, { loading: updateUserLoading }] = useMutation<PostUserResponse>("/api/users", {
    onSuccess: () => {
      mutateUser();
      closeModal(CustomModal, "HometownDropdown");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeocodeDistrictError":
          openToast<MessageToastProps>(MessageToast, "GeocodeDistrictError", {
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
  const [updateDummy, { loading: updateDummyLoading }] = useMutation<PostDummyResponse>("/api/users/dummy", {
    onSuccess: () => {
      mutateUser();
      closeModal(CustomModal, "HometownDropdown");
    },
    onError: (data) => {
      switch (data?.error?.name) {
        case "GeocodeDistrictError":
          openToast<MessageToastProps>(MessageToast, "GeocodeDistrictError", {
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
    // dummy user
    if (user?.id === -1) {
      if (updateDummyLoading) return;
      updateDummy(updateData);
      return;
    }
    // membership user
    if (updateUserLoading) return;
    updateUser(updateData);
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
        openModal<LayerModalProps>(LayerModal, "HometownUpdate", {
          headerType: "default",
          title: "내 동네 설정하기",
          contents: <HometownUpdate />,
        });
        closeModal(CustomModal, "HometownDropdown");
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
