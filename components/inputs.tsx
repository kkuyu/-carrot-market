import type { HTMLAttributes, ReactElement } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputsProps extends HTMLAttributes<HTMLInputElement> {
  name: string;
  type: string;
  required?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
  prependText?: string;
  appendButtons?: ReactElement;
}

const Inputs = (props: InputsProps) => {
  const { name, type, required = false, disabled, register, prependText, appendButtons, className = "", ...restProps } = props;

  return (
    <div className={`relative flex items-center ${className}`}>
      {prependText && (
        <div className="absolute top-1/2 left-3 -translate-y-1/2">
          <span className="text-sm text-gray-500">{prependText}</span>
        </div>
      )}
      <input
        {...register}
        id={name}
        type={type}
        name={name}
        required={required}
        disabled={disabled}
        className={`peer w-full px-3 py-1.5 placeholder-gray-400 bg-transparent border-none appearance-none rounded-md
        focus:border-none focus:outline-none focus:ring-0 ${disabled ? "opacity-80" : ""}`}
        style={{ ...(prependText ? { paddingLeft: `calc(0.75rem + ${prependText.length * 0.75}rem + 0.45rem)` } : {}) }}
        {...restProps}
      />
      {appendButtons && <div className="mx-1 flex space-x-2">{appendButtons}</div>}
      <span
        className={`absolute top-0 left-0 right-0 bottom-0 border border-gray-300 rounded-md pointer-events-none
      peer-focus:border-orange-500 peer-focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]`}
      />
    </div>
  );
};

export default Inputs;
