import { cls } from "@libs/utils";

interface ButtonProps {
  large?: boolean;
  text: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  theme?: "orange" | "white";
  [key: string]: any;
}

export default function Button({ large = false, text, disabled, type = "button", theme = "orange", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      {...rest}
      className={cls(
        "w-full px-4 font-semibold border rounded-md shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        large ? "py-3 text-base" : "py-2 text-sm ",
        theme === "orange" ? "text-white bg-orange-500 border-transparent hover:bg-orange-600 focus:ring-orange-500" : "",
        theme === "white" ? "text-black border-gray-400 hover:border-gray-500 focus:ring-gray-400" : "",
        disabled ? "opacity-50" : ""
      )}
    >
      {text}
    </button>
  );
}
