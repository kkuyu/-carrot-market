import useUser from "@libs/client/useUser";

import { ModalControl, ToastControl, UpdateHometown } from "@components/layouts/header";

interface AddressButtonProps {
  toastControl: ToastControl;
  modalControl: ModalControl;
  updateHometown: UpdateHometown;
}

const AddressButton = ({ toastControl, modalControl, updateHometown }: AddressButtonProps) => {
  const { user, currentAddr } = useUser();

  const onClick = () => {
    // dummy user
    if (user?.id === -1) {
      modalControl("updateModal", { open: true });
      return;
    }
    // membership user
    if (user?.SUB_emdPosNm) modalControl("dropdownModal", { open: true });
    if (!user?.SUB_emdPosNm) modalControl("updateModal", { open: true });
  };

  if (!currentAddr.emdPosNm) {
    return null;
  }

  return (
    <button className="h-12 flex items-center px-5" onClick={onClick}>
      <span className="pr-1 text-lg font-semibold">{currentAddr.emdPosNm}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
  );
};

export default AddressButton;
