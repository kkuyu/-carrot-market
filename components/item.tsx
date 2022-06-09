import Link from "next/link";

interface ItemProps {
  href: string;
  title: string;
  price: number;
  hearts: number;
}

export default function Item({ href, title, price, hearts }: ItemProps) {
  return (
    <Link href={href}>
      <a className="flex justify-between items-stretch w-full px-4 py-5">
        <div className="flex space-x-4">
          <div className="flex-none w-20 h-20 bg-gray-400 rounded-md" />
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <span className="mt-1 font-semibold text-gray-900">${price}</span>
          </div>
        </div>
        <div className="flex items-end justify-end space-x-2">
          <div className="flex items-center space-x-0.5 text-sm text-gray-600">
            <svg className="flex-none w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
            <span>{hearts}</span>
          </div>
        </div>
      </a>
    </Link>
  );
}
