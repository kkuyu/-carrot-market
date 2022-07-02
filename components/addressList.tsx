import { ReactNode } from "react";

export interface AddressItem {
  id: string;
  addrNm: string;
  emdNm: string;
  emdCd: string;
}

interface AddressListProps {
  list: AddressItem[];
  selectItem: (item: AddressItem) => void;
}

const AddressList = ({ list, selectItem }: AddressListProps) => {
  if (!list.length) {
    return null;
  }

  return (
    <ul className="divide-y">
      {list.map((item) => (
        <li key={item.id}>
          <button type="button" onClick={() => selectItem({ ...item })} className="block py-2 w-full text-left">
            {item.addrNm}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default AddressList;
