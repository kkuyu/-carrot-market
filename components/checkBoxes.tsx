import type { HTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface CheckBoxesProps extends HTMLAttributes<HTMLInputElement> {
  name: string;
  id: string;
  text: string;
  value?: string | number | readonly string[];
  required?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
}

const CheckBoxes = (props: CheckBoxesProps) => {
  const { name, id, value, text, required = false, disabled, register, className = "", ...restProps } = props;

  return (
    <span className={`relative block ${className}`}>
      <input {...register} id={id} type="checkbox" name={name} required={required} disabled={disabled} value={value} {...restProps} className="peer sr-only" />
      <span className="absolute top-0.5 left-0 text-gray-300 peer-checked:text-orange-500 pointer-events-none" aria-hidden="true">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <label htmlFor={id} className="pl-6">
        {text}
      </label>
    </span>
  );
};

export default CheckBoxes;
