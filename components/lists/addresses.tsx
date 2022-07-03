export interface AddressItem {
  id: string;
  addrNm: string;
  emdNm: string;
  emdCd: string;
}

interface AddressesProps {
  list: AddressItem[];
  selectItem: (item: AddressItem) => void;
}

const Addresses = ({ list, selectItem }: AddressesProps) => {
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

export default Addresses;
