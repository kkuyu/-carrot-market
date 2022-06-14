import React, { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends React.HTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  kind?: "text" | "phone" | "price";
  type: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  appendButton?: ReactNode;
  [key: string]: any;
}

export default function Input({ label, name, kind = "text", type, required = false, register, appendButton, ...rest }: InputProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700" htmlFor={name}>
        {label}
      </label>
      {kind === "text" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <input
            id={name}
            type={type}
            required={required}
            {...register}
            {...rest}
            className="w-full px-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          {appendButton}
        </div>
      ) : null}
      {kind === "price" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <div className="absolute left-0 flex items-center justify-center pl-3 pointer-events-none">
            <span className="text-sm text-gray-500">$</span>
          </div>
          <input
            id={name}
            type={type}
            required={required}
            {...register}
            {...rest}
            className="w-full pl-7 pr-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          <div className="absolute right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">USD</span>
          </div>
        </div>
      ) : null}
      {kind === "phone" ? (
        <div className="relative flex rounded-md shadow-sm">
          <span className="flex items-center justify-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md select-none">+82</span>
          <input
            id={name}
            type={type}
            required={required}
            {...register}
            {...rest}
            className="w-full px-3 py-2 appearance-none border border-gray-300 rounded-md rounded-l-none shadow-sm placeholder-gray-400
              focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      ) : null}
    </div>
  );
}
