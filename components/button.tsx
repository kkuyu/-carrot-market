import { cls } from "../libs/utils";

interface ButtonProps {
  large?: boolean;
  text: string;
  [key: string]: any;
}

export default function Button({ large = false, onClick, text, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cls(
        "w-full px-4 font-semibold text-white border border-transparent rounded-md shadow-sm bg-orange-500",
        "hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
        large ? "py-3 text-base" : "py-2 text-sm "
      )}
    >
      {text}
    </button>
  );
}
