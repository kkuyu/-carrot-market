import type { HTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface TextAreasProps extends HTMLAttributes<HTMLTextAreaElement> {
  name?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  register?: UseFormRegisterReturn;
}

const TextAreas = (props: TextAreasProps) => {
  const { name, required = false, register, disabled, minLength, className = "", ...restProps } = props;

  return (
    <div className={`relative flex items-center ${className}`}>
      <textarea
        id={name}
        className={`peer w-full px-3 py-1.5 placeholder-gray-400 bg-transparent border-none appearance-none rounded-md
        focus:border-none focus:outline-none focus:ring-0 ${disabled ? "opacity-80" : ""}`}
        rows={4}
        required={required}
        disabled={disabled}
        minLength={minLength}
        {...register}
        {...restProps}
      />
      <span
        className={`absolute top-0 left-0 right-0 bottom-0 border border-gray-300 rounded-md pointer-events-none
      peer-focus:border-orange-500 peer-focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]`}
      />
    </div>
  );
};

export default TextAreas;
