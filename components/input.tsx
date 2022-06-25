import { cls } from "@libs/utils";
import React, { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends React.HTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  kind?: "text" | "price";
  type: string;
  required?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
  appendButtons?: ReactNode;
  [key: string]: any;
}

export default function Input({ label, name, kind = "text", type, required = false, disabled, register, appendButtons, ...rest }: InputProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <label className="block text-sm font-semibold text-gray-700" htmlFor={name}>
          {label}
        </label>
      ) : null}
      {kind === "text" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <input
            id={name}
            type={type}
            name={name}
            required={required}
            disabled={disabled}
            {...register}
            {...rest}
            className={cls(
              "w-full px-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400",
              "focus:outline-none focus:ring-orange-500 focus:border-orange-500",
              disabled ? "bg-gray-200" : ""
            )}
          />
          {appendButtons && <div className="ml-2 flex space-x-2">{appendButtons}</div>}
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
            name={name}
            required={required}
            disabled={disabled}
            {...register}
            {...rest}
            className={cls(
              "w-full pl-7 pr-3 py-2 appearance-none border border-gray-300 rounded-md placeholder-gray-400",
              "focus:outline-none focus:ring-orange-500 focus:border-orange-500",
              disabled ? "bg-gray-200" : ""
            )}
          />
          <div className="absolute right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">USD</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
