import type { HTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
// @components
import Icons from "@components/icons";

interface CheckBoxesProps<T> extends HTMLAttributes<HTMLInputElement> {
  name: string;
  id: string;
  text: string;
  value?: T;
  required?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
}

const CheckBoxes = <T extends string | number | boolean>(props: CheckBoxesProps<T>) => {
  const { name, id, value = undefined, text, required = false, disabled, register, className = "", ...restProps } = props;

  return (
    <span className={`relative block ${className}`}>
      <input {...register} id={id} type="checkbox" name={name} required={required} disabled={disabled} value={value?.toString()} {...restProps} className="peer sr-only" />
      <span
        className="absolute top-0.5 left-0 text-gray-500 rounded-full pointer-events-none [&>svg:first-child]:block [&>svg:last-child]:hidden
          peer-focus:ring-2 peer-focus:ring-gray-300 peer-checked:text-orange-500 peer-checked:[&>svg:first-child]:hidden peer-checked:[&>svg:last-child]:block"
        aria-hidden="true"
      >
        <Icons name="CheckCircle" className="w-5 h-5" />
        <Icons name="CheckCircleSold" className="w-5 h-5" />
      </span>
      <label htmlFor={id} className="pl-6">
        {text}
      </label>
    </span>
  );
};

export default CheckBoxes;
