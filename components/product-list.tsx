import { Kind, Product, Record as RecordData } from "@prisma/client";
import useSWR from "swr";

import Item from "./item";

interface ProductListProps {
  kindValue: Kind;
}

type Records = Record<Kind, (RecordData & { product: Product & { records: RecordData[] } })[]>;
type RecordsResponse = Records & {
  success: boolean;
};

export default function ProductList({ kindValue }: ProductListProps) {
  const { data, error } = useSWR<RecordsResponse>(`/api/users/my/records?kind=${kindValue}`);

  if (!data || !data.success || error) {
    return null;
  }

  return (
    <div className="-mx-4 flex flex-col divide-y">
      {data?.[kindValue].map((recordItem) => (
        <Item key={recordItem.id} href={`/products/${recordItem.product.id}`} title={recordItem.product.name} price={recordItem.product.price} hearts={recordItem.product.records.length} />
      ))}
    </div>
  );
}
