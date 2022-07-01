import useUser from "@libs/client/useUser";

interface AddressButtonProps {
  buttonClick: () => void;
}

const AddressButton = ({ buttonClick }: AddressButtonProps) => {
  const { currentAddr } = useUser();

  if (!currentAddr.emdPosNm) {
    return null;
  }

  return (
    <button className="flex items-center px-5 py-3" onClick={buttonClick}>
      <span className="pr-1 text-lg font-semibold">{currentAddr.emdPosNm}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
  );
};

export default AddressButton;
