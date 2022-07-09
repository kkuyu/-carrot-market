interface AddressButtonProps {
  text: string;
  onClick: () => void;
}

const AddressButton = ({ text, onClick }: AddressButtonProps) => {
  if (!text) {
    return null;
  }

  return (
    <button className="h-12 flex items-center px-5" onClick={onClick}>
      <span className="pr-1 text-lg font-semibold">{text}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
  );
};

export default AddressButton;
