import React, { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputsProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  kind?: "text" | "price";
  type: string;
  required?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
  appendButtons?: ReactNode;
  [key: string]: any;
}

const Inputs = ({ name, kind = "text", type, required = false, disabled, register, appendButtons, ...rest }: InputsProps) => {
  if (kind === "price") {
    return (
      <div className="relative flex items-center rounded-md shadow-sm">
        <div className="absolute left-0 flex items-center justify-center pl-3 pointer-events-none">
          <span className="text-sm text-gray-500">₩</span>
        </div>
        <input
          {...register}
          id={name}
          type={type}
          name={name}
          required={required}
          disabled={disabled}
          className={`w-full pl-7 pr-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400
            focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${disabled ? "opacity-80" : ""}`}
          {...rest}
        />
        {appendButtons && <div className="ml-2 flex space-x-2">{appendButtons}</div>}
      </div>
    );
  }

  return (
    <div className="relative flex items-center rounded-md">
      <input
        {...register}
        id={name}
        type={type}
        name={name}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400
          focus:ring-orange-500 focus:border-orange-500 ${disabled ? "opacity-80" : ""}`}
        {...rest}
      />
      {appendButtons && <div className="ml-2 flex space-x-2">{appendButtons}</div>}
    </div>
  );
};

export default Inputs;
