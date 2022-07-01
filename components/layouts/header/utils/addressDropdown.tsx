import useUser from "@libs/client/useUser";

import { ModalControl, ToastControl, UpdateHometown } from "@components/layouts/header";

interface AddressDropdownProps {
  toastControl: ToastControl;
  modalControl: ModalControl;
  updateHometown: UpdateHometown;
}

const AddressDropdown = ({ toastControl, modalControl, updateHometown }: AddressDropdownProps) => {
  const { user } = useUser();

  const addressButtons = [
    {
      key: "MAIN",
      text: user?.MAIN_emdPosNm || "MAIN",
      isActive: user?.emdType === "MAIN",
      selectItem: () => {
        if (user?.emdType === "MAIN") return;
        modalControl("dropdownModal", { open: false, beforeClose: () => updateHometown({ emdType: "MAIN" }) });
      },
    },
    {
      key: "SUB",
      text: user?.SUB_emdPosNm || "SUB",
      isActive: user?.emdType === "SUB",
      selectItem: () => {
        if (user?.emdType === "SUB") return;
        modalControl("dropdownModal", { open: false, beforeClose: () => updateHometown({ emdType: "SUB" }) });
      },
    },
    {
      key: "ANOTHER",
      text: "내 동네 설정하기",
      isActive: false,
      selectItem: () => {
        modalControl("updateModal", { open: true });
        modalControl("dropdownModal", { open: false });
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

export default AddressDropdown;
