import { ReactNode } from "react";

export interface AddressItem {
  id: string;
  addrNm: string;
  emdNm: string;
  emdCd: string;
}

interface AddressListProps {
  isLoading: boolean;
  list: AddressItem[];
  selectItem: (item: AddressItem) => void;
  emptyGuide: ReactNode;
}

const AddressList = ({ isLoading, list, selectItem, emptyGuide }: AddressListProps) => {
  if (isLoading) {
    return (
      <div className="py-2 text-center">
        <span className="text-gray-500">로딩중</span>
      </div>
    );
  }

  if (!list.length) {
    return <>{emptyGuide}</>;
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
