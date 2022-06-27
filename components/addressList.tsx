import Buttons from "@components/buttons";

interface Item {
  id: string;
  addrName: string;
  admCd: string | null;
  admNm: string | null;
  posX: string | null;
  posY: string | null;
}

interface AddressListProps {
  isLoading: boolean;
  list: Item[];
  selectItem: (item: Item) => void;
  resetForm: () => void;
}

const AddressList = ({ isLoading, list, selectItem, resetForm }: AddressListProps) => {
  return (
    <div className="">
      {isLoading ? (
        <div className="py-2 text-center">
          <span className="text-gray-500">로딩중</span>
        </div>
      ) : list.length ? (
        <ul className="divide-y">
          {list.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => selectItem({ ...item })} className="block py-2 w-full text-left">
                {item.addrName}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-2 text-center">
          <p className="text-gray-500">
            검색 결과가 없어요.
            <br />
            동네 이름을 다시 확인해주세요!
          </p>
          <Buttons tag="button" type="button" sort="text-link" size="base" text="동네 이름 다시 검색하기" onClick={resetForm} className="mt-2" />
        </div>
      )}
    </div>
  );
};

export default AddressList;
